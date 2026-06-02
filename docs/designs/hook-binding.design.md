# Design: Hook Binding

## Vấn đề

Cần intercept việc tạo page mới (`Browser.newContext()` → `BrowserContext.newPage()`) để tự động resize viewport. Cũng cần chặn `page.setViewportSize()` vì kích thước đã bị fingerprint lock.

## Giải pháp: Proxy Pattern

Dùng ES6 `Proxy` để intercept method calls.

### onClose (`adapter/playwright/utils.ts`)

```ts
export function onClose(target: Browser | BrowserContext, listener: () => void): void {
  if (isBrowser(target)) {
    target.on('disconnected', listener);
  } else {
    target.on('close', listener);
  }
}
```

### bindHooks

Proxy Browser.newContext:
```ts
const original = target.newContext.bind(target);
target.newContext = async (options) => {
  const ctx = await original(resetOptions(options));  // Force viewport: null
  patchContext(ctx);
  return ctx;
};
```

patchContext proxy:
- Proxy `ctx.newPage()`: gọi `hooks.onPageCreated(page)` sau khi tạo page
- patchPage: proxy `page.setViewportSize()` → warning + no-op

### resetOptions

```ts
function resetOptions<T>(options: T): T & { viewport: null } {
  return { ...options, viewport: null };
}
```

Force `viewport: null` để Playwright không tự resize -- engine sẽ resize qua CDP sau.

### Tại sao dùng Proxy?

Thay vì EventEmitter pattern, dùng `Proxy` vì:
- Không cần monkey-patch prototype
- Có thể intercept chính xác method gọi
- Clean hơn so với override bằng assign

---

Xem thêm: [Spec](../specs/hook-binding.spec.md) | [Plan](../plans/hook-binding.plan.md)
