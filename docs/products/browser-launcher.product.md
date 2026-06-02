# Product: Browser Launcher

## Tổng quan

Browser Launcher chịu trách nhiệm khởi chạy Chromium và phát hiện CDP (Chrome DevTools Protocol) endpoint để các thành phần khác (như FingerprintPlugin) có thể inject fingerprint qua CDP.

Bạn không dùng Browser Launcher trực tiếp -- nó được gọi ngầm bởi `Chromium.launch()`.

## Cách hoạt động

1. **Spawn Chromium** với `--remote-debugging-port` và các arguments.
2. **Đọc output** của Chromius (stderr + stdout) dòng từng dòng.
3. **Tìm dòng** `DevTools listening on ws://127.0.0.1:<port>/...`.
4. **Parse port** từ URL.
5. **Trả về** `Browser` object với method `close()` để tắt.

## API

### `launch(options)`

| Tham số | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `args` | `string[]` | `[]` | Arguments cho Chromium |
| `timeout` | `number` | `30000` | Thời gian chờ tối đa (ms) |
| `userDataDir` | `string` | `''` | Thư mục profile |
| `debuggingPort` | `number` | `0` | Port debugging (`0` = random) |
| `executablePath` | `string` | `''` | Đường dẫn Chromium |

```ts
const browser = await launch({
  executablePath: 'C:\\Program Files\\Chromium\\chrome.exe',
  args: ['--disable-web-security'],
  debuggingPort: 9222,
  timeout: 60000,
});
console.log(`DevTools URL: ${browser.url}`);
await browser.close();
```

### `Browser` object

| Property | Mô tả |
|---|---|
| `process` | ChildProcess của Chromium |
| `port` | Port debugging |
| `url` | WebSocket URL của DevTools |
| `close()` | Kill Chromium và toàn bộ process con |
| `configure()` | (Hiện tại chưa làm gì) |

## Xử lý lỗi

| Lỗi | Nguyên nhân |
|---|---|
| Timeout | Chromium không in DevTools URL kịp |
| taskkill lỗi | Fallback về `childProcess.kill()` |

## Lưu ý

- **`close()` dùng `taskkill /T /F`** -- Windows-specific. Kill toàn bộ process tree (kể cả renderer, GPU).
- **Timeout mặc định 30 giây** -- nếu Chromium chậm, có thể tăng lên.
- **`configure()` là no-op** -- dự phòng cho tương lai.
- Cần parse cả stderr và stdout vì mỗi phiên bản Chromium có thể in DevTools URL ở nơi khác nhau.

---
