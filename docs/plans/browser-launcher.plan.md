# Plan: Browser Launcher

- [x] Bước 1: Định nghĩa Browser interface `{ process, port, url, configure(), close() }`
  - `port`: number (parsed từ CDP URL)
  - `url`: string (ws://...)
  - `configure()`: no-op mặc định, override bởi config.ts

- [x] Bước 2: Định nghĩa LaunchOptions `{ debuggingPort, userDataDir, headless, timeout, args, executablePath }`
  - `debuggingPort`: số, mặc định 0 (random)

- [x] Bước 3: Implement launch() -- spawn process + readline + regex
  - `child_process.spawn(executablePath, args)`
  - `readline.createInterface({ input: childProcess.stderr })` -- parse line-by-line
  - Regex `DevTools listening on (ws:\/\/[^\s]+)` -- global flag cho nhiều target
  - Resolve URL từ match đầu tiên

- [x] Bước 4: Implement close() -- taskkill + fallback
  - `taskkill /pid <pid> /T /F` kill toàn bộ process tree
  - Fallback: `process.kill('SIGKILL')` nếu taskkill fail

## Edge cases

- stderr output có thể không có dòng DevTools nếu worker.exe lỗi → Promise treo vô hạn (cần timeout riêng)
- `readline` không tự động close -- cần gọi `rl.close()` sau khi resolve
- `new URL(url).port` có thể trả về empty string nếu port không được chỉ định (default 80/443)
- CDP URL có thể xuất hiện ở stdout thay vì stderr -- regex scan cả 2 streams
