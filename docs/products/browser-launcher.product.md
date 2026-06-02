# Product: Browser Launcher

## Tổng quan

Launch Chromium từ engine binary và phát hiện CDP URL tự động.

## Cách hoạt động

1. Spawn `worker.exe` với `--remote-debugging-port=0` (port random)
2. Parse `DevTools listening on ws://...` từ stderr
3. Trả về Browser object với close() dùng taskkill để dọn process tree

## Close safety

Dùng `taskkill /pid <pid> /T /F` thay vì `process.kill()`:
- `/T`: kill toàn bộ process tree (worker.exe + chromium con)
- `/F`: force kill
- Fallback: `process.kill()` nếu taskkill fail
