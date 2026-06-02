# Design: Debug Logging

## Vấn đề

Cần logging có tổ chức, dễ bật/tắt theo module để debug.

## Giải pháp

Dùng thư viện `debug` với namespace:
- `fingerprint:connector` — IPC với engine
- `fingerprint:plugin` — FingerprintPlugin
- `fingerprint:adapter` — Playwright adapter

Bật qua env: `DEBUG=fingerprint:*`

## Tại sao chọn `debug`?

- Nhẹ, zero dependency
- Namespace có wildcard
- Dễ dùng, quen thuộc với Node.js dev

---

Xem thêm: [Spec](../specs/debug-logging.spec.md) | [Plan](../plans/debug-logging.plan.md)
