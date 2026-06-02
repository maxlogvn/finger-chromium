# Plan: Fix quit() không dọn dẹp hết handles

## Các bước thực hiện

### Step 1: Engine.ts -- Lưu process reference + thêm kill()

**File: `src/plugin/connector/engine.ts`**

- [ ] 1.1 Thêm field `#process: ChildProcess | undefined = undefined` trong class `RemoteEngine`
- [ ] 1.2 Trong `#startProcessInternal()`, gán `this.#process = proc` sau khi spawn
- [ ] 1.3 Thêm public method `kill()`:
  ```ts
  kill(): void {
    if (this.#process && !this.#process.killed) {
      this.#process.kill();
      this.#process = undefined;
    }
  }
  ```

### Step 2: pcapServer -- Lưu server reference + export close()

**File: `src/plugin/connector/pcapServer/index.ts`**

- [ ] 2.1 Khai báo `let server: net.Server | undefined;` ở module scope
- [ ] 2.2 Trong `listen()`, gán `server = ...` khi tạo mới
- [ ] 2.3 Export `close()` -- **set undefined trong callback, không set trước**:
  ```ts
  export const close = (): Promise<void> => {
    return new Promise((resolve) => {
      if (server) {
        server.close(() => {
          server = undefined;   // ← set SAU khi close hoàn tất
          resolve();
        });
      } else {
        resolve();
      }
    });
  };
  ```

### Step 3: Connector -- Thêm cleanup()

**File: `src/plugin/connector/index.ts`**

- [ ] 3.1 Import `pcapServer` (đã có)
- [ ] 3.2 Export `cleanup()`:
  ```ts
  export const cleanup = async (): Promise<void> => {
    engine.kill();
    await pcapServer.close();
  };
  ```

### Step 4: Cleaner -- Thêm stop() + unlock files

**File: `src/plugin/cleaner.ts`**

- [ ] 4.1 Thêm public method `stop()` -- clear interval + unlock files còn locked + clear folders:
  ```ts
  async stop(): Promise<void> {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    // Unlock tất cả file còn locked trước khi clear folders
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

### Step 5: Mutex -- Thêm release() export

**File: `src/plugin/mutex/index.ts`**

- [ ] 5.1 Thêm `release()` export:
  ```ts
  export const release = (name: string): void => {
    if (typeof mutex.close === 'function') {
      mutex.close(name);
    }
  };
  ```
  Lưu ý: native C++ addon cần có method `close()`. Nếu chưa có, skip silently -- Windows kernel tự cleanup khi process thoát.

### Step 6: FingerprintPlugin -- Lưu Browser ref + thêm cleanup()

**File: `src/plugin/index.ts`**

- [ ] 6.1 Import `cleaner` (đã có)
- [ ] 6.2 Import `cleanup as connectorCleanup` từ `./connector`
- [ ] 6.3 Import `release as mutexRelease` từ `./mutex`
- [ ] 6.4 Thêm field `protected browser?: Browser;`
- [ ] 6.5 Thêm field `protected processId?: string;` -- lưu pid từ setup response
- [ ] 6.6 Trong `_launch()`, sau khi nhận setupData, gán `this.processId = pid;`
- [ ] 6.7 Trong `_launch()`, sau dòng spawn browser, gán `this.browser = browser;`
- [ ] 6.8 Thêm method `cleanup()`:
  ```ts
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = undefined;
    }
    await connectorCleanup();
    if (this.processId) {
      mutexRelease(`BASProcess${this.processId}`);
    }
    await cleaner.stop();
  }
  ```

### Step 7: PlaywrightFingerprintPlugin -- Override cleanup()

**File: `src/adapter/playwright/engine.ts`**

- [ ] 7.1 Override `cleanup()` nếu cần dọn dẹp thêm ở tầng Playwright
  (Hiện tại không cần -- `configure()` đã xử lý hooks, `BrowserContext.close()` đã xong ở quit)

### Step 8: Chromium.ts -- Mở rộng quit()

**File: `src/adapter/playwright/chromium.ts`**

- [ ] 8.1 Chuyển `this.isLaunched = false` lên đầu method (sau guard) để chặn concurrent:
  ```ts
  async quit(saveDataPath?: string): Promise<void> {
    if (!this.isLaunched) return;
    this.isLaunched = false;  // guard concurrent calls
    ...
  }
  ```
- [ ] 8.2 Sau khi close context, thêm gọi engine cleanup:
  ```ts
  await this.engine.cleanup();
  ```

## Kiểm tra

- [ ] **Lint pass:** `npm run lint` -- 0 errors
- [ ] **Build pass:** `npm run build` -- tsup bundle thành công
- [ ] **Manual test:** Gọi `quit()`, verify process list không còn worker.exe/FastExecuteScript.exe
- [ ] **Manual test:** Gọi `quit()` 2 lần -- không crash
- [ ] **Manual test:** Gọi `quit()` sau `newContext()` -- Node.js process exit tự nhiên

## Ghi chú

- Thứ tự dọn dẹp quan trọng: browser (worker.exe) trước, engine sau,
  cleaner cuối cùng (vì cleaner unlock file cần process đã chết)
- Không cần sửa tests hiện tại vì đây là extension, không phải breaking change
- `pcapServer.listen()` dùng `once()` -- chỉ chạy một lần. `close()` đảo ngược.
