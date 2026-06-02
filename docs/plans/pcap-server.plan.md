# Plan: PCAP Server

## Các bước thực hiện

- [x] **Bước 1: Tạo TCP server với `net.createServer`**
  - Lắng nghe trên `host:port` (mặc định 127.0.0.1, port 0 = random).
  - Xử lý 2 loại lệnh: `0x01` (request ID), `0x07` (heartbeat).
  - Dùng `once()` để chỉ tạo một server.

- [x] **Bước 2: Xử lý EADDRINUSE**
  - Retry sau 1 giây với `setTimeout().unref()`.

- [x] **Bước 3: Export `listen` function**
  - Trả về `Promise<number>` với port đang lắng nghe.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/connector/pcapServer/index.ts` | PCAP server |

## Kiểm tra

- `npm run lint` -- 0 errors.
- `net` module là built-in Node.js, không cần cài thêm.

## Ghi chú

- Port 0 = random port (OS tự cấp phát).
- Địa chỉ mặc định là `127.0.0.1` -- chỉ chấp nhận kết nối local.
- `once()` đảm bảo không tạo server trùng.

---
