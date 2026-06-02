# Spec: Hook Binding

## Mô tả

Proxy Playwright methods để intercept page creation và viewport.

## Components

| Function | Mô tả |
|---|---|
| `onClose(target, listener)` | Đăng ký cleanup (disconnected/close event) |
| `bindHooks(target, hooks)` | Proxy newContext/newPage/setViewportSize |
| `setViewport(page, options)` | CDP resize |
| `getViewport(page)` | Lấy kích thước |

## Proxy chain

```
Browser.newContext() → patchContext()
  → BrowserContext.newPage() → onPageCreated hook
    → Page.setViewportSize() → blocked (warning)
```

---

Xem thêm: [Design](../designs/hook-binding.design.md) | [Plan](../plans/hook-binding.plan.md)
