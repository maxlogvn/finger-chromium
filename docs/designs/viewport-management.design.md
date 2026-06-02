# Design: Quản lý Viewport

## Vấn đề

Kích thước viewport là một phần của fingerprint. Cần resize browser về đúng kích thước fingerprint và đồng bộ availWidth/availHeight vào engine .ini.

## Giải pháp

CDP-based resize với retry (max 3 lần):
- Delta correction: tự điều chỉnh nếu sai lệch
- `configure()` → cleanup + `setViewport`
- `synchronize()` → ghi availWidth/availHeight vào `.ini`

---

Xem thêm: [Spec](../specs/viewport-management.spec.md) | [Plan](../plans/viewport-management.plan.md)
