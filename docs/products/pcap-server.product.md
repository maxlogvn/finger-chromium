# Product: PCAP Server

## Tổng quan

PCAP Server là một TCP server tối thiểu (52 dòng code) mô phỏng PCAP interface mà `worker.exe` yêu cầu. Nó chạy ngầm, bạn không cần tương tác.

## Tại sao cần server này?

Khi `worker.exe` (engine binary) khởi động, nó luôn cố gắng kết nối tới PCAP server để:
1. **Lấy request ID** (mã `0x01`): dùng để định danh request trong log nội bộ
2. **Gửi heartbeat** (mã `0x07`): báo hiệu worker còn sống

Nếu không có server, worker.exe sẽ crash vì không kết nối được TCP.

## Server hoạt động thế nào

Server chạy trên `127.0.0.1:<port>` (OS tự assign port). Nó chỉ xử lý 2 lệnh binary:

| Lệnh | Worker gửi | Server trả về |
|---|---|---|
| Request ID | `[0x01]` | `[0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id, id>>8, id>>16]` |
| Heartbeat | `[0x07]` | `[0x07, 0x00, 0x00, 0x00, 0x00]` |

Request ID server tăng dần: 1, 2, 3... (tối đa ~16 triệu).

## Singleton

Server chỉ được tạo một lần duy nhất (dùng `once()` package). Nếu module được import nhiều lần, lần thứ 2 trả về port cũ. Port này được truyền vào engine qua arg `--mock-pcap-port=<port>`.

## Retry port

Nếu port đã được dùng (EADDRINUSE), server tự động retry sau 1 giây. Timer retry `.unref()` -- không chặn process exit.
