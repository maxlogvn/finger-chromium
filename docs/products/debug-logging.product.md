# Product: Debug Logging

## Mô tả

Debug logging dùng thư viện `debug` với namespace theo từng module. Dễ bật/tắt qua biến môi trường `DEBUG`. Zero overhead khi không dùng — `debug` package tự động tắt khi không có namespace match.

## Cách sử dụng

```bash
# Windows CMD
set DEBUG=browser-with-fingerprints:* & node app.js

# PowerShell
$env:DEBUG='browser-with-fingerprints:*'
node app.js
```

Chỉ một namespace:

```bash
set DEBUG=browser-with-fingerprints:connector & node app.js
```

Nhiều namespace:

```bash
set DEBUG=browser-with-fingerprints:connector,browser-with-fingerprints:cleaner & node app.js
```

## Hành vi chi tiết

### Namespaces

| Namespace | Log gì | File source |
|---|---|---|
| `browser-with-fingerprints:connector` | API Connector, PCAP server start | `connector/index.ts` |
| `browser-with-fingerprints:connector:engine` | Engine download, extract, IPC request/response | `connector/engine.ts` |
| `browser-with-fingerprints:connector:pcapServer` | PCAP server lifecycle | `connector/pcapServer/index.ts` |
| `browser-with-fingerprints:cleaner` | File cleanup daemon | `plugin/cleaner.ts` |

### Ví dụ output

```
browser-with-fingerprints:connector:engine Dang tai browser... +0ms
browser-with-fingerprints:connector:engine Engine giai nen thanh cong... +5342ms
browser-with-fingerprints:connector:engine Dang goi method "setup"... +10234ms
browser-with-fingerprints:connector PCAP server dang lang nghe tai port 54321 +11000ms
```

## Giới hạn và điều kiện

- Log ra **stderr**, không phải stdout.
- Không hỗ trợ file transport — chỉ output terminal.
- Trên Windows: dùng `set` (cmd) hoặc `$env:DEBUG` (PowerShell). `export` không hoạt động.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/debug-logging.spec.md`
- Design: `docs/designs/debug-logging.design.md`
- Source: toàn bộ file dùng `debugFactory`
