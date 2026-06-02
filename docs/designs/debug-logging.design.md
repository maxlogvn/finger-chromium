# Design: Debug Logging

## Vấn đề

Cần logging theo module để debug từng layer: connector (IPC với engine), plugin (lifecycle orchestration), adapter (Playwright bridge). Dễ bật/tắt, không ảnh hưởng production.

## Giải pháp: `debug` package

Namespace convention: `browser-with-fingerprints:<module>`

### Namespace map

| Namespace | File | Mục đích |
|---|---|---|
| `browser-with-fingerprints:connector` | `connector/index.ts` | API Connector, PCAP server start |
| `browser-with-fingerprints:connector:engine` | `connector/engine.ts` | Engine IPC, download, extract, spawn |
| `browser-with-fingerprints:connector:pcapServer` | `connector/pcapServer/index.ts` | PCAP server lifecycle |
| `browser-with-fingerprints:cleaner` | `plugin/cleaner.ts` | File cleanup daemon |

### Cách bật

```bash
# Tất cả
set DEBUG=browser-with-fingerprints:* & node app.js

# Một module
set DEBUG=browser-with-fingerprints:connector & node app.js

# Nhiều module
set DEBUG=browser-with-fingerprints:connector,browser-with-fingerprints:cleaner & node app.js
```

### Tại sao chọn `debug`?

- Zero dependency (nhẹ).
- Namespace với wildcard support.
- Output có màu (terminal), format `namespace message +elapsed-time`.
- Zero overhead khi tắt -- nếu DEBUG env không match, function là no-op.

---

Xem thêm: [Spec](../specs/debug-logging.spec.md) | [Plan](../plans/debug-logging.plan.md)
