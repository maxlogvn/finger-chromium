# Overview: Fix quit() không dọn dẹp hết handles

## Kế hoạch vs Thực tế

| Step | Nội dung | Trạng thái |
|---|---|---|
| 1 | engine.ts -- lưu process ref + kill() | Done |
| 2 | pcapServer/index.ts -- server ref + close() | Done |
| 3 | connector/index.ts -- cleanup() | Done |
| 4 | cleaner.ts -- stop() + unlock | Done |
| 5 | mutex/index.ts -- release() | Done |
| 6 | plugin/index.ts -- browser ref + cleanup() | Done |
| 7 | PlaywrightFingerprintPlugin override | Không cần |
| 8 | chromium.ts -- quit() mở rộng | Done |

## Sai lệch so với plan

1. **`isConnected()` check** -- `Browser` interface trong launcher không có method này. Thay bằng try/catch đơn giản: `this.browser.close().catch(() => {})`.
2. **PlaywrightFingerprintPlugin override** (Step 7) -- không cần override vì `FingerprintPlugin.cleanup()` đã xử lý browser.close() và connector. Playwright layer không có tài nguyên riêng cần dọn.

## Kết quả

- **Lint:** 0 errors, 16 warnings (all pre-existing `no-explicit-any`)
- **Build:** tsup bundle thành công (ESM + CJS + DTS)
- **Test:** Chưa chạy (cần browser thật)

## Files đã sửa

| File | Thay đổi |
|---|---|
| `src/plugin/connector/engine.ts` | `#process` field, `kill()` method |
| `src/plugin/connector/pcapServer/index.ts` | Module-level `server`, `close()` export |
| `src/plugin/connector/index.ts` | `cleanup()` export |
| `src/plugin/cleaner.ts` | `stop()` method (clear interval + unlock files) |
| `src/plugin/mutex/index.ts` | `release()` export |
| `src/plugin/index.ts` | `browser` + `processId` fields, `cleanup()` method, imports |
| `src/adapter/playwright/chromium.ts` | `quit()`: guard sớm, gọi `engine.cleanup()` |

## Cleanup flow hoàn chỉnh

```
Chromium.quit()
  1. isLaunched = false                    (guard concurrent)
  2. BrowserContext.close()                (đã có)
  3. map profile về thư mục đích           (đã có)
  4. FingerprintPlugin.cleanup()
     a. browser.close()                    taskkill worker.exe
     b. connectorCleanup()
        - engine.kill()                    kill FastExecuteScript.exe
        - pcapServer.close()               close TCP server
     c. mutex.release()                    release BASProcess{pid}
     d. cleaner.stop()                     clearInterval + unlock
  5. dataManager.unmap()                   xoá temp dir
```
