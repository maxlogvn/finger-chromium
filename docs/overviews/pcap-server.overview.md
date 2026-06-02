# Overview: PCAP Server

## Tóm tắt

Đã triển khai TCP server mô phỏng PCAP interface. Xử lý 2 lệnh binary (`0x01` request ID, `0x07` heartbeat), retry port khi EADDRINUSE, dùng `once()` pattern để listen một lần.

## Kiến trúc

```
PcapServer
  |-- listen()        tạo TCP server + once() guard
  |     |-- getPort() lấy port từ engine args
  |     |-- retry EADDRINUSE sau 1s
  |
  |-- close()         đóng server
  |
  |-- binary protocol:
  |     0x01 -> gửi request ID (4 bytes, little-endian)
  |     0x07 -> heartbeat response (0x07)
  |
  |-- module-level biến: server (net.Server | null)
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| Module-level `server` | `src/plugin/connector/pcapServer/index.ts` | 14 |
| `getPort()` | `src/plugin/connector/pcapServer/index.ts` | 16-21 |
| `listen()` | `src/plugin/connector/pcapServer/index.ts` | 23-80 |
| Binary data handler | `src/plugin/connector/pcapServer/index.ts` | 40-68 |
| `close()` | `src/plugin/connector/pcapServer/index.ts` | 82-91 |

## Binary protocol

```
Client -> Server:
  0x01 [requestId: 4 bytes LE]    -> Server response: <requestId as hex string>
  0x07                             -> Server response: 0x07

Ví dụ:
  Gửi:  01 4E 00 00 00            (requestId = 78)
  Nhận: 4E                        (hex của 78)

  Gửi:  07
  Nhận: 07
```

## Quyết định thiết kế

- **`once()` pattern**: `server` biến là module-level, `listen()` kiểm tra `server === null` -- chỉ listen một lần. Tránh multiple server instances.
- **EADDRINUSE retry**: Port có thể bị chiếm. Retry sau 1s với port khác (từ engine args). Max retries: infinite (dừng khi success hoặc lỗi khác EADDRINUSE).
- **Binary protocol TCP thay vì HTTP**: Engine native giao tiếp qua TCP binary. HTTP overhead không cần thiết cho heartbeat và request ID.

## Lưu ý

- Server biến là module-level, không export -- chỉ dùng nội bộ trong module.
- `getPort()` lấy port từ engine arguments (`--pcap-port`).
- `close()` kiểm tra `server !== null` -- safe multi-call.

## Tài liệu liên quan

- `docs/designs/pcap-server.design.md`
- `docs/specs/pcap-server.spec.md`
- `docs/plans/pcap-server.plan.md`
- `docs/products/pcap-server.product.md`
- `src/plugin/connector/pcapServer/index.ts`
