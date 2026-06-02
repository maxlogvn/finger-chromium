# Design: PCAP Server

## Vấn đề

Engine binary (`worker.exe`) yêu cầu kết nối TCP tới PCAP server để lấy packet ID và heartbeat. Cần một mock server tối thiểu đáp ứng 2 lệnh binary.

## Giải pháp

Minimal TCP server dùng `net.createServer`, wrap với `once()` để đảm bảo singleton.

### Binary protocol

Server xử lý 2 lệnh:

**0x01** -- Request ID:
- Client gửi: `[0x01]` (1 byte)
- Server trả: `[0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id, id>>8, id>>16]` (9 bytes)
- `id` là counter tăng dần mỗi lần request

**0x07** -- Heartbeat:
- Client gửi: `[0x07]` (1 byte)  
- Server trả: `[0x07, 0x00, 0x00, 0x00, 0x00]` (5 bytes)

### Port handling

- Mặc định port 0 (OS tự assign)
- Host 127.0.0.1
- Nếu `EADDRINUSE`: retry sau 1s (`setTimeout(...).unref()`)

### Tại sao cần server này?

Engine binary `worker.exe` kết nối tới PCAP server để:
1. Lấy request ID (0x01) -- dùng để định danh từng request trong internal logging
2. Gửi heartbeat (0x07) -- báo hiệu worker còn sống

Server là mock vì project không dùng PCAP thật, chỉ cần đáp ứng tối thiểu để engine binary hoạt động.

---

Xem thêm: [Spec](../specs/pcap-server.spec.md) | [Plan](../plans/pcap-server.plan.md)
