# Design: API Connector

## Vấn đề

Cần wrapper đồng bộ hoá các lời gọi đến RemoteEngine, tránh race condition khi nhiều instance cùng gọi API.

## Giải pháp

- Singleton `RemoteEngine` instance
- `api(name, params)` wrapper với `async-lock` (key 'client')
- Tự động normalize error: `MissingKeyError` / `PluginError`
- Auto-start PCAP server

---

Xem thêm: [Spec](../specs/api-connector.spec.md) | [Plan](../plans/api-connector.plan.md)
