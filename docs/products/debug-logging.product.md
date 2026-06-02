# Product: Debug Logging

## Tổng quan

Structured logging với `debug` package. Mỗi module có namespace riêng, dễ bật/tắt.

## Cách bật

```bash
# Bật tất cả
set DEBUG=browser-with-fingerprints:* & node app.js

# Chỉ connector
set DEBUG=browser-with-fingerprints:connector & node app.js

# Nhiều module
set DEBUG=browser-with-fingerprints:connector,browser-with-fingerprints:cleaner & node app.js
```

## Namespaces

| Namespace | Log gì | File chính |
|---|---|---|
| `browser-with-fingerprints:connector` | API Connector, PCAP server start | `connector/index.ts` |
| `browser-with-fingerprints:connector:engine` | Engine download, extract, IPC request/response | `connector/engine.ts` |
| `browser-with-fingerprints:connector:pcapServer` | PCAP server lifecycle | `connector/pcapServer/index.ts` |
| `browser-with-fingerprints:cleaner` | File cleanup daemon | `plugin/cleaner.ts` |

## Ví dụ output

```
browser-with-fingerprints:connector:engine Dang tai browser... +0ms
browser-with-fingerprints:connector:engine Engine giai nen thanh cong... +5342ms
browser-with-fingerprints:connector:engine Dang goi method "setup"... +10234ms
browser-with-fingerprints:connector PCAP server dang lang nghe tai port 54321 +11000ms
browser-with-fingerprints:cleaner File lock tai duong dan ... khong duoc cap nhat. +12000ms
```

## Lưu ý

- `debug` tự động thêm timestamp (elapsed time từ process start).
- Mỗi namespace một màu khác nhau trong terminal.
- Zero overhead khi tắt (DEBUG không set) -- logger là no-op function.
- Trên Windows, dùng `set` thay `export`.

---
