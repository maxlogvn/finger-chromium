# Spec: Debug Logging

## Mô tả

Logging dùng `debug` package, namespace theo module.

## Namespaces

| Namespace | File |
|---|---|
| `fingerprint:connector` | `connector/*` |
| `fingerprint:plugin` | `plugin/*` |
| `fingerprint:adapter` | `adapter/*` |

## Usage

```bash
# Bật tất cả
DEBUG=fingerprint:* npm start

# Bật một module
DEBUG=fingerprint:connector npm start
```

---

Xem thêm: [Design](../designs/debug-logging.design.md) | [Plan](../plans/debug-logging.plan.md)
