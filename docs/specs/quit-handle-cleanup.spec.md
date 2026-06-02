# Spec: Fix quit() không dọn dẹp hết handles

## Mô tả

`quit()` hiện chỉ close `BrowserContext` và unmap profile. Cần mở rộng để dọn dẹp đầy đủ
tất cả tài nguyên nền: worker.exe, engine process, PCAP server, chokidar watcher, cleaner timer, mutex.

Mục tiêu cuối: sau khi gọi `quit()`, Node.js process có thể thoát tự nhiên (không cần `process.exit()`).

## Yêu cầu

- `quit()` phải kill toàn bộ child processes (worker.exe + FastExecuteScript.exe)
- `quit()` phải close PCAP server (TCP listener)
- `quit()` phải stop cleaner timer + unlock files
- `quit()` phải release Windows named mutex
- `quit()` phải an toàn khi gọi concurrent (guard flag set sớm)
- `quit()` phải tránh double-close browser (try/catch swallow)
- `quit()` vẫn an toàn khi gọi nhiều lần
- Không làm thay đổi public API hiện tại
- Không gây crash nếu resource đã được dọn dẹp từ trước

## Thiết kế

### 1. Lưu Browser reference

**File: `src/plugin/index.ts`**

```ts
protected browser?: Browser;

// Trong _launch(), sau khi spawn:
this.browser = browser;
```

### 2. Cleanup flow

```
quit() được gọi:
  1. Set isLaunched = false     (guard concurrent calls)
  2. Close BrowserContext       (đã có)
  3. browser.close()            -> taskkill /T /F worker.exe (try/catch swallow)
  4. engine.kill()              -> kill FastExecuteScript.exe
  5. pcapServer.close()         -> close TCP server (set undefined sau callback)
  6. mutex.release()            -> release BASProcess{pid}
  7. cleaner.stop()             -> clearInterval + unlock files
  8. unmap profile              (đã có)
```

### 3. RemoteEngine.kill()

**File: `src/plugin/connector/engine.ts`**

```ts
#process?: ChildProcess;

// Lưu process khi start:
this.#process = await this.#startProcess(timeout);

// Method kill:
kill(): void {
  if (this.#process && !this.#process.killed) {
    this.#process.kill();
    this.#process = undefined;
  }
}
```

### 4. pcapServer.close()

**File: `src/plugin/connector/pcapServer/index.ts`**

Hiện tại server không được export. Cần lưu reference và export `close()`.

```ts
let server: net.Server;

export const close = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
      server = undefined;
    } else {
      resolve();
    }
  });
};
```

### 5. Connector cleanup

**File: `src/plugin/connector/index.ts`**

```ts
export const cleanup = async (): Promise<void> => {
  engine.kill();
  await pcapServer.close();
};
```

### 6. Cleaner stop

**File: `src/plugin/cleaner.ts`**

```ts
async stop(): Promise<void> {
  if (this.#timer) {
    clearInterval(this.#timer);
    this.#timer = null;
  }
  // Unlock tất cả file còn locked -- gọi check() rồi unlock nếu còn locked
  for (const folder of this.#folders) {
    const pattern = path.join(folder, '{t,s}', '*');
    const entries = await fg(pattern, { stats: true, onlyFiles: false });
    for (const { path: entryPath } of entries) {
      const isLocked = await lock.check(entryPath).catch(() => false);
      if (isLocked) {
        await lock.unlock(entryPath).catch(() => {});
      }
    }
  }
  this.#folders = [];
}
```

### 7. Mutex release

**File: `src/plugin/mutex/index.ts`**

```ts
export const release = (name: string): void => {
  if (typeof mutex.close === 'function') {
    mutex.close(name);
  }
};
```

Native C++ addon hiện chỉ có `create()`. Method `close()` cần được thêm vào native module.
Nếu chưa có, Windows kernel tự cleanup handle khi process thoát -- đây là fallback an toàn.

### 8. Double browser.close() guard

**Trong `FingerprintPlugin.cleanup()`:**

```ts
if (this.browser) {
  await this.browser.close().catch(() => {});
}
```

`Browser` interface trong launcher không có `isConnected()` nên dùng try/catch thay thế.
Nếu `browser.close()` throw (process đã dead bởi `context.close()` của Playwright), error bị swallow.

### 9. Race condition pcapServer.close()

```ts
server.close(() => {
  server = undefined;  // set undefined SAU khi callback chạy
  resolve();
});
```

### 10. Concurrent quit()

```ts
async quit(): Promise<void> {
  if (!this.isLaunched) return;
  this.isLaunched = false;  // set sớm -- chặn concurrent calls
  // ... cleanup ...
}
```

### 7. Mở rộng quit()

**File: `src/adapter/playwright/chromium.ts`**

```ts
async quit(saveDataPath?: string): Promise<void> {
  if (!this.isLaunched) return;

  if (this.context) {
    await this.context.close();
    this.context = undefined;

    const targetSavePath = saveDataPath ?? this.saveProfileDirPath;
    if (targetSavePath) {
      this.dataManager.map(this.profileData[0], targetSavePath);
    }
  }

  // --- Bước mới: Dọn dẹp engine + connector
  await this.engine.cleanup();

  this.dataManager.unmap(BROWSER_RUNNING_DIR);
  this.isLaunched = false;
}
```

## API / Data flow

```
Chromium.quit()
  -> BrowserContext.close()
  -> AdapterDataManager.map()           // lưu profile
  -> PlaywrightFingerprintPlugin.cleanup()
    -> FingerprintPlugin.cleanup()
      -> browser.close()                // taskkill worker.exe
      -> connector.cleanup()
        -> engine.kill()                // kill FastExecuteScript.exe
        -> pcapServer.close()           // close TCP
      -> cleaner.stop()                 // clearInterval
  -> AdapterDataManager.unmap()
```

## Components

| Component | Method | Chức năng |
|---|---|---|
| `FingerprintPlugin` | `cleanup()` | Dọn dẹp tổng thể: browser.close(), connector cleanup, cleaner stop, mutex release |
| `BrowserEngine` (chromium.ts) | `quit()` | Set isLaunched sớm, gọi engine.cleanup(), unmap profile |
| `RemoteEngine` | `kill()` | Kill FastExecuteScript.exe process |
| `pcapServer` | `close()` | Close TCP server (set undefined sau callback) |
| `connector/index.ts` | `cleanup()` | Gọi engine.kill() + pcapServer.close() |
| `SettingsCleaner` | `stop()` | Clear interval + unlock files còn locked |
| `mutex/index.ts` | `release()` | Gọi native close() nếu có |

## Xử lý lỗi

- `browser.close()` fail → `.catch(() => {})` swallow, tiếp tục dọn bước sau
- `browser.close()` fail → `.catch(() => {})` swallow (browser đã đóng bởi Playwright context.close)
- `engine.kill()` không có process → skip silently
- `pcapServer.close()` chưa listen (server === undefined) → resolve ngay
- `pcapServer.close()` callback → `server = undefined` đặt trong callback
- `mutex.release()` native không có `close` → skip silently
- `cleaner.stop()` không có timer → skip; unlock fail → `.catch(() => {})`
- `quit()` concurrent → guard bằng `isLaunched = false` ngay đầu method
- An toàn khi gọi `quit()` nhiều lần (idempotent)

## Kiểm tra

- `quit()` kill worker.exe: kiểm tra process list sau quit
- `quit()` kill engine: verify process không còn trong task manager
- `quit()` close PCAP: verify port được giải phóng
- `quit()` gọi 2 lần: không crash
- `quit()` khi chưa launch: không crash
- Node.js process exit tự nhiên sau quit (không cần process.exit)
