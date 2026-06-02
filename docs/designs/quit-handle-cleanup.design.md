# Design: Fix quit() không dọn dẹp hết handles

## Bối cảnh

Khi người dùng gọi `Chromium.quit()`, method này chỉ close `BrowserContext` (Playwright)
và unmap thư mục profile tạm. Nó bỏ sót toàn bộ các tài nguyên nền:

- **worker.exe** -- child process được spawn bởi launcher
- **FastExecuteScript.exe** -- engine process do RemoteEngine quản lý
- **PCAP server** -- TCP server mock do connector khởi động
- **Chokidar watcher** -- theo dõi file response trong engine IPC
- **Cleaner timer** -- interval 15s quét file tạm
- **Windows named mutex** -- `BASProcess{pid}`

Hậu quả: Node.js process không biết khi nào cần thoát vì event loop còn bận
(event listeners, TCP connections, child process stdio).

## Phân tích hiện trạng

### Luồng gọi:

```
Chromium.newContext()
  -> PlaywrightFingerprintPlugin.launchPersistentContext()
    -> _launch(false, opts)                   // plugin/index.ts:232
      -> api('setup', ...)                    // khởi tạo engine
      -> cleaner.watch(pwd).ignore(pwd, pid, id)
      -> mutex.create(`BASProcess${pid}`)
      -> launcher.launch(...)                 // spawn worker.exe
      -> configFn(...)                        // configure viewport
      -> return browser                       // Browser { process, close(), ... }
    -> return context as BrowserContext       // ** Browser bị mất reference **
  -> return BrowserContext
```

### Những gì quit() làm:

| Resource | quit() hiện tại | Cần |
|---|---|---|
| BrowserContext | Close (dòng 196) | OK |
| Profile temp dir | Unmap (dòng 207) | OK |
| worker.exe process | **Không** | Kill process tree |
| FastExecuteScript.exe | **Không** | Kill process |
| PCAP server | **Không** | Close server |
| Chokidar watcher | **Không** | Close watcher |
| Cleaner timer | **Không** | Stop interval + unlock |
| Mutex | **Không** | Release handle |

## Giải pháp đề xuất

### Phương án A -- Lưu reference và dọn dẹp tập trung

Lưu `Browser` object và engine process reference trong FingerprintPlugin,
mở rộng `quit()` để gọi dọn dẹp tuần tự.

**Lợi:** Tập trung, dễ debug, có thể gọi từ ngoài.
**Hại:** Cần sửa nhiều file (plugin, engine, connector, chromium).

### Phương án B -- Cleanup handler chain

Mỗi module đăng ký cleanup handler vào một registry, `quit()` gọi tất cả handlers.

**Lợi:** Module độc lập, không sửa nhiều class.
**Hại:** Phức tạp hoá lifecycle, khó đảm bảo thứ tự.

### Chọn: Phương án A

Lý do:
1. Dễ hiểu và maintain -- dọn dẹp tuần tự, rõ ràng
2. `quit()` đã có sẵn, chỉ cần mở rộng
3. Tránh side effect của handler chain

### Thiết kế chi tiết

#### 1. Lưu Browser reference

`FingerprintPlugin._launch()` hiện trả về `Browser`. Cần lưu vào field:
```ts
protected browser?: Browser;
```

`PlaywrightFingerprintPlugin.launchPersistentContext()` cần expose browser ref
thay vì nuốt mất.

#### 2. Mở rộng FingerprintPlugin

Thêm method `cleanup()`:
```ts
async cleanup(): Promise<void> {
  // 1. Đóng browser (kill worker.exe)
  if (this.browser) {
    await this.browser.close();
    this.browser = undefined;
  }
  // 2. Dừng cleaner
  await cleaner.stop();
  // ... các bước khác
}
```

#### 3. Expose engine kill + PCAP close

`RemoteEngine` cần method `kill()` để đóng process.
`pcapServer` cần method `close()` để đóng TCP server.
`Connector` cần method `cleanup()`.

## Các module cần sửa

| File | Thay đổi |
|---|---|
| `src/plugin/connector/engine.ts` | Thêm `kill()`, lưu process reference làm field |
| `src/plugin/connector/pcapServer/index.ts` | Export `close()` method |
| `src/plugin/connector/index.ts` | Thêm `cleanup()` gọi engine kill + pcap close |
| `src/plugin/index.ts` | Lưu `Browser` ref, thêm `cleanup()` call connector cleanup |
| `src/adapter/playwright/engine.ts` | Pass browser ref lên, expose cho quit |
| `src/adapter/playwright/chromium.ts` | Mở rộng `quit()` gọi engine cleanup + dừng cleaner |
| `src/plugin/cleaner.ts` | Thêm `stop()` method dừng timer + unlock files |
| `src/plugin/mutex/index.ts` | Thêm `release()` export |

## Mutex

Windows named mutex (`BASProcess{pid}`) là kernel object -- OS tự cleanup khi process kết thúc.
Nhưng nếu process chạy dài và gọi `quit()` giữa chừng, handle mutex vẫn tồn tại.

Native addon hiện chỉ có `create()`, không có `release()`. Cần thêm:

```ts
// Thử gọi .close() từ native nếu có, nếu không thì log warning
export const release = (name: string): void => {
  if (typeof mutex.close === 'function') {
    mutex.close(name);
  }
};
```

Vì native C++ addon cần biên dịch lại nếu thêm method, giải pháp tạm thời:
- Export `release()` gọi `mutex.close` nếu native hỗ trợ
- Nếu không, chấp nhận OS cleanup (Windows kernel tự dọn khi process thoát)

## Chokidar watcher

Watcher trong `RemoteEngine.runFunction()` đã được close trong `finally` block:
```ts
} finally {
  await requestWatcher.close();  // đã có
}
```

Không cần thay đổi -- watcher chỉ sống trong thời gian chờ response.

## Double browser.close()

`BrowserContext.close()` trong Playwright có thể trigger browser close.
Sau đó gọi `browser.close()` từ launcher (taskkill) sẽ throw.

Fix: `Browser` interface không có `isConnected()`, dùng try/catch:
```ts
if (this.browser) {
  await this.browser.close().catch(() => {});
}
```

## Race condition pcapServer.close()

`server = undefined` phải set trong callback, sau khi close hoàn tất:
```ts
server.close(() => {
  server = undefined;
  resolve();
});
```

## Concurrent quit()

Set `isLaunched = false` ngay đầu method để chặn concurrent calls.
