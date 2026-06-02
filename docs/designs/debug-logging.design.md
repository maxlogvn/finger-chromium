# Design: Debug Logging

## Vấn đề

Cần logging theo module để debug từng layer: connector (IPC với engine), plugin (lifecycle orchestration), adapter (Playwright bridge). Dễ bật/tắt không ảnh hưởng production.

## Giải pháp: `debug` package

Namespace convention: `fingerprint:<module>`

```ts
import debug from 'debug';

const logConnector = debug('fingerprint:connector');
const logPlugin = debug('fingerprint:plugin');
const logAdapter = debug('fingerprint:adapter');
```

### Namespace map

| Namespace | File | Mục đích |
|---|---|---|
| `fingerprint:connector` | `connector/engine.ts`, `connector/index.ts` | Engine IPC, download, extract, setup |
| `fingerprint:plugin` | `plugin/index.ts` | Lifecycle, config methods |
| `fingerprint:adapter` | `adapter/*.ts` | Playwright bridge, hooks, viewport |

### Cách bật

```bash
# Tất cả
set DEBUG=fingerprint:* & node app.js

# Một module
set DEBUG=fingerprint:connector & node app.js

# Nhiều module
set DEBUG=fingerprint:connector,fingerprint:plugin & node app.js
```

### Tại sao chọn `debug`?

- Zero dependency (nhẹ)
- Namespace với wildcard support
- Output có màu (terminal), format `namespace message`
- Không ảnh hưởng performance khi tắt (vì property getter bypass)

---

Xem thêm: [Spec](../specs/debug-logging.spec.md) | [Plan](../plans/debug-logging.plan.md)
