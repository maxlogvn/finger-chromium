# Design: PCAP Server

## Vấn đề cần giải quyết

Engine binary (`FastExecuteScript.exe`) cố gắng kết nối tới một PCAP interface để capture network traffic. Tuy nhiên, trong môi trường phát triển, chúng ta không có PCAP hardware thật. Engine có chế độ `--mock-connector` cho phép giả lập PCAP qua TCP socket.

Cần một TCP server nhỏ để:
1. **Phản hồi request ID** khi engine hỏi `0x01` -- engine cần một ID để định danh.
2. **Phản hồi heartbeat** khi engine gửi `0x07` -- engine kiểm tra kết nối còn sống không.
3. **Chịu lỗi port** -- nếu port đã được dùng, thử lại sau 1 giây.

## Giải pháp chọn

### Kiến trúc

```
Engine (FastExecuteScript.exe)
    │
    ├── TCP connect → pcapServer (127.0.0.1:<port>)
    │
    ├── Gửi 0x01 (request ID)
    │   └── Server trả: header (7 bytes) + ID (4 bytes)
    │       └── ID tăng dần mỗi lần request
    │
    └── Gửi 0x07 (heartbeat)
        └── Server trả: header 5 bytes
```

### Giao thức binary

Mỗi request từ engine là 1 byte đầu tiên xác định loại lệnh:

| Byte | Lệnh | Response |
|---|---|---|
| `0x01` | Request ID | `[0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id(3 bytes)]` |
| `0x07` | Heartbeat | `[0x07, 0x00, 0x00, 0x00, 0x00]` |

### Tại sao dùng `once()` cho `listen()`?

PCAP server chỉ cần một instance cho toàn bộ ứng dụng. `once()` đảm bảo dù `listen()` được gọi bao nhiêu lần, chỉ một server được tạo.

### Tại sao retry khi EADDRINUSE?

Port có thể bị chiếm bởi instance trước (nếu app crash không kịp giải phóng). Retry sau 1 giây giúp tự động phục hồi.

---
