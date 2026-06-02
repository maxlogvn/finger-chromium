# Design: Hook Binding

## Vấn đề

Cần intercept việc tạo page mới (newContext, newPage) để đảm bảo viewport luôn đúng kích thước fingerprint. Cũng cần chặn setViewportSize vì kích thước đã bị fingerprint lock.

## Giải pháp

Proxy Pattern:
- `bindHooks(target, hooks)` → proxy `newContext` (Browser) và `newPage` (BrowserContext)
- `patchPage(page)` → proxy `setViewportSize` → warning + no-op
- `onClose(target, listener)` → register cleanup handler

---

Xem thêm: [Spec](../specs/hook-binding.spec.md) | [Plan](../plans/hook-binding.plan.md)
