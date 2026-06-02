# Product: Browser Launcher

## Tổng quan

Browser Launcher spawn Chromium từ engine binary và phát hiện CDP URL tự động. Dùng `taskkill` để dọn process tree sạch sẽ.

## Cách hoạt động

Khi launch được gọi:

1. **Spawn**: `child_process.spawn('worker.exe', [...args, '--remote-debugging-port=<port>'])`
2. **Detect CDP**: Parse stderr với regex `DevTools listening on (ws://...)`
3. **Return**: Browser object `{ process, port, url, configure, close }`

## Safer Close

Khi bạn gọi `close()`:

```ts
// Luôn dùng taskkill để giết toàn bộ process tree
taskkill /pid <pid> /T /F

// Fallback nếu taskkill không có
process.kill('SIGKILL')
```

`/T` giết worker.exe và tất cả Chromium process con. Process.kill thông thường chỉ giết được process cha.

## CDP Connection

Browser object chứa `url` (WebSocket URL) và `port` (port number). CDP Inspector có thể kết nối trực tiếp:

```
DevTools listening on ws://127.0.0.1:54213/devtools/browser/abc123
```

## Lưu ý

- `configure()` là no-op mặc định -- được override sau bởi viewport config
- CDP URL có thể xuất hiện ở stdout hoặc stderr -- launcher scan cả 2
- Nếu worker.exe crash trước khi in CDP URL, Promise sẽ treo -- cần timeout riêng ở tầng trên
