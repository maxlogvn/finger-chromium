# Plan: Browser Launcher

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa `Browser` interface**
  - `process: ChildProcess`, `port: number`, `url: string`, `configure()`, `close()`.

- [x] **Bước 2: Định nghĩa `LaunchOptions` interface**
  - `args`, `timeout`, `userDataDir`, `debuggingPort`, `executablePath`.

- [x] **Bước 3: Implement `launch()` function**
  - Spawn Chromium với `--remote-debugging-port`.
  - Parse DevTools URL từ stderr/stdout.
  - Xử lý timeout.

- [x] **Bước 4: Implement `close()` method**
  - Dùng `taskkill /T /F` cho Windows.
  - Fallback về `childProcess.kill()` nếu taskkill lỗi.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/launcher/index.ts` | Browser launcher |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Chạy thủ công với Chromium thật.

## Ghi chú

- `close()` chỉ dùng được trên Windows (taskkill).
- `configure()` hiện tại là no-op.
- Cần `executablePath` trỏ đến Chromium hợp lệ.

---
