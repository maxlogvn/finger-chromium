# Product: Hook Binding

## Tổng quan

Hook Binding intercept các Playwright methods để đảm bảo viewport luôn đúng fingerprint.

## Cách hoạt động

- `bindHooks()` proxy `newContext` và `newPage` để tự động resize
- `onClose()` đăng ký cleanup handler (disconnected cho Browser, close cho BrowserContext)
- `setViewportSize` bị chặn và in warning -- kích thước đã bị fingerprint lock

```ts
// Tự động resize mỗi khi tạo page mới
bindHooks(context, {
  onPageCreated: async (page) => {
    await setViewport(page, { width: 1920, height: 1080 });
  }
});
```
