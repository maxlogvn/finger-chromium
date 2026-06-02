# Design: Common Scripts (In-browser)

## Vấn đề

Cần script chạy trong browser context qua `page.evaluate()` để kiểm tra resize hoàn tất và lấy viewport.

## Giải pháp

2 scripts trong object `scripts`:
- `waitForResize`: ResizeObserver + double requestAnimationFrame
- `getViewport`: `{ width: window.innerWidth, height: window.innerHeight }`

Double rAF đảm bảo layout đã ổn định sau resize.

---

Xem thêm: [Spec](../specs/common-scripts.spec.md) | [Plan](../plans/common-scripts.plan.md)
