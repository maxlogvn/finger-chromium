# Product: PCAP Server

## Tổng quan

PCAP Server là một TCP server rất nhỏ (52 dòng) chạy ngầm để giao tiếp với engine binary. Nó mô phỏng PCAP interface -- một thiết bị phần cứng bắt gói tin mạng -- bằng cách phản hồi 2 loại lệnh binary.

Bạn không bao giờ cần dùng PCAP server trực tiếp. Nó tự động khởi động khi thư viện được import.

## Cách hoạt động

```
Engine (FastExecuteScript.exe) ←→ PCAP Server (TCP 127.0.0.1:<port>)

1. Engine gửi byte 0x01 → Server trả về ID (tăng dần)
2. Engine gửi byte 0x07 → Server trả về heartbeat OK
```

### Request ID

Khi engine cần một ID để định danh phiên làm việc:

```
Engine: [01]
Server: [01 04 00 00 00 0A ID(3 bytes)]
```

### Heartbeat

Khi engine kiểm tra kết nối còn sống:

```
Engine: [07]
Server: [07 00 00 00 00]
```

## API

### `listen(port?, host?)`

```ts
const port = await pcapServer.listen();  // Random port
// hoặc
const port = await pcapServer.listen(12345);  // Port cụ thể
```

| Tham số | Mặc định | Mô tả |
|---|---|---|
| `port` | `0` (random) | Cổng TCP |
| `host` | `'127.0.0.1'` | Địa chỉ lắng nghe |

Trả về: port number đang lắng nghe.

## Lưu ý

- **Tự động retry** nếu port bận (EADDRINUSE) -- thử lại sau 1 giây.
- **Chỉ một server** được tạo -- dùng `once()` để đảm bảo.
- **Không giữ process sống** -- `setTimeout().unref()` cho phép Node thoát nếu không còn tác vụ nào.
- Chỉ chấp nhận kết nối từ localhost (127.0.0.1).

---
