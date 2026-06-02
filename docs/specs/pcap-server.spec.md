# Spec: PCAP Server

## Mô tả

Mock TCP server mô phỏng PCAP interface cho engine.

## Giao thức

| Byte | Ý nghĩa | Response |
|---|---|---|
| `0x01` | Request ID | 9 bytes: `01 04 00 00 00 0a [id 3 bytes]` |
| `0x07` | Heartbeat | 5 bytes: `07 00 00 00 00` |

## Xử lý lỗi

- `EADDRINUSE`: retry sau 1s

---

Xem thêm: [Design](../designs/pcap-server.design.md) | [Plan](../plans/pcap-server.plan.md)
