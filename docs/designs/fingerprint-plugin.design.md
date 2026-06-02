# Design: FingerprintPlugin -- Core orchestrator

## Vấn đề

Cần một class trung tâm điều phối toàn bộ vòng đời: cấu hình, spawn worker, configure, cleanup.

## Giải pháp

Class `FingerprintPlugin` với Fluent API:
- `useFingerprint/useProxy/useProfile/useBrowserVersion` -- cấu hình
- `fetch/versions` -- gọi API service
- `spawn/_launch` -- khởi động worker.exe

Lifecycle: setup → spawn → configure → cleanup.

---

Xem thêm: [Spec](../specs/fingerprint-plugin.spec.md) | [Plan](../plans/fingerprint-plugin.plan.md)
