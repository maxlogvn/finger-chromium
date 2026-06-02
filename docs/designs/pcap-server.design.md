# Design: PCAP Server

## Vấn đề

Engine cần một PCAP interface để giao tiếp. Cần mock TCP server tối thiểu.

## Giải pháp

Minimal TCP server xử lý 2 lệnh binary:
- `0x01` -- request ID, trả về ID tăng dần
- `0x07` -- heartbeat, trả về ACK

Dùng `once()` để chỉ một server được tạo. Retry port khi `EADDRINUSE`.

---

Xem thêm: [Spec](../specs/pcap-server.spec.md) | [Plan](../plans/pcap-server.plan.md)
