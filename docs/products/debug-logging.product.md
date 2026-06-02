# Product: Debug Logging

## Tổng quan

Logging theo module dùng `debug` package.

## Cách dùng

```bash
set DEBUG=fingerprint:* && node app.js
```

Namespaces:
- `fingerprint:connector` — IPC request/response
- `fingerprint:plugin` — lifecycle events
- `fingerprint:adapter` — Playwright operations

## Tính năng

- Bật/tắt theo module
- Wildcard (dấu `*`)
- Không ảnh hưởng performance khi tắt
