# Design: Hook Binding

## Vấn đề

Cần intercept việc tạo page mới (`Browser.newContext()` -> `BrowserContext.newPage()`) để tự động resize viewport theo fingerprint. Cũng cần chặn `page.setViewportSize()` vì kích thước đã bị fingerprint lock.

## Giải pháp: ES6 Proxy Pattern

### onClose()

Đăng ký cleanup handler:
- `Browser` -> event `'disconnected'`.
- `BrowserContext` -> event `'close'`.
- Phân biệt bằng type guard `isBrowser()` (kiểm tra `'version' in target && typeof target.version === 'function'`).

### bindHooks()

Proxy chain 3 lớp:

```
Browser.newContext()
  -> resetOptions() force viewport: null
  -> patchContext()
    -> ctx.newPage() -> proxy: gọi hooks.onPageCreated(page)
    -> patchPage()
      -> page.setViewportSize() -> proxy: warning + no-op
```

1. **Browser level**: Proxy `newContext()`, force `viewport: null` qua `resetOptions()`.
2. **Context level**: Proxy `newPage()`, gọi `onPageCreated` hook sau khi tạo page.
3. **Page level**: Proxy `setViewportSize()`, chặn hoàn toàn (in warning, không throw).

### Fallback khi target là BrowserContext

Nếu `target` truyền vào `bindHooks()` đã là `BrowserContext` (không qua `Browser.newContext`), gọi `patchContext()` trực tiếp. Trường hợp này xảy ra khi `PlaywrightFingerprintPlugin.configure()` nhận context từ `launchPersistentContext()`.

### resetOptions()

```ts
function resetOptions<T>(options: T): T & { viewport: null } {
  return { ...options, viewport: null };
}
```

Force `viewport: null` để Playwright không tự resize -- engine sẽ resize qua CDP sau.

### Tại sao dùng Proxy?

- Không cần monkey-patch prototype.
- Intercept chính xác method gọi.
- Clean hơn so với override bằng assign.

---

Xem thêm: [Spec](../specs/hook-binding.spec.md) | [Plan](../plans/hook-binding.plan.md)
