# Spec: Hook Binding

## File: `src/adapter/playwright/utils.ts` (124 dòng)

### Functions

| Function | Input | Output | Mô tả |
|---|---|---|---|
| `onClose` | `Browser \| BrowserContext + listener` | `void` | Đăng ký cleanup handler |
| `bindHooks` | `Browser \| BrowserContext + Hooks` | `void` | Proxy methods |
| `setViewport` | `Page + ViewportBounds` | `Promise<void>` | CDP resize |
| `getViewport` | `Page` | `Promise<{width, height}>` | Lấy viewport |

### Constants

```ts
export const MAX_RESIZE_RETRIES = 3;
```

### Type guard

```ts
const isBrowser = (target: unknown): target is Browser =>
  typeof target === 'object' && target !== null
    && 'version' in target && typeof (target as Browser).version === 'function';
```

### Proxy chain chi tiết

```
Browser.newContext()
  -> resetOptions (force viewport: null)
  -> patchContext()
    -> ctx.newPage()
      -> proxy: hooks.onPageCreated(page)
      -> patchPage()
        -> page.setViewportSize()
          -> proxy: warning + no-op
```

### `bindHooks()` Flow

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `if (isBrowser(target))` | Nếu là Browser -> proxy newContext |
| 2 | `target.newContext = new Proxy(...)` | Apply: resetOptions + patchContext |
| 3 | `patchContext(ctx)` | Proxy ctx.newPage -> onPageCreated hook + patchPage |
| 4 | `patchPage(page)` | Proxy page.setViewportSize -> warning no-op |
| 5 | `if (!isBrowser && !target.newContext)` | Fallback: patchContext trực tiếp |

### `setViewport()` (adapter version)

```ts
export const setViewport = async (page: Page, { diff, width, height }): Promise<void>
```

Flow:

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `const cdp = await page.context().newCDPSession(page)` | Tạo CDP session từ Playwright page |
| 2 | `const { windowId } = await cdp.send('Browser.getWindowForTarget')` | Lấy window handle |
| 3 | `delta = diff ?? { width: 16, height: 88 }` | Delta mặc định (window chrome) |
| 4 | Loop `MAX_RESIZE_RETRIES (3)` | Retry |
| 4a | `bounds = { width: desiredW + deltaW, height: desiredH + deltaH }` | Tính bounds |
| 4b | `await Promise.all([cdp.send('Browser.setWindowBounds', { bounds, windowId }), waitForResize(page)])` | Set + chờ |
| 4c | `viewport = await getViewport(page)` | Verify |
| 4d | Nếu match -> break | Đúng |
| 4e | `delta += expected - actual` | Điều chỉnh |
| 5 | `await cdp.detach()` | Ngắt CDP session |

### `getViewport()` (adapter version)

```ts
page.evaluate(scripts.getViewport)  // { width, height }
```

### `onClose()` Flow

```ts
if (isBrowser(target)) {
  target.once('disconnected', listener);
} else {
  target.once('close', () => listener());
}
```

---

## Kiểm tra

- Cần browser thật -- không thể mock proxy chain.
- Verify: `page.setViewportSize()` in warning, không đổi viewport.
- Verify: `onClose` cleanup chạy khi browser disconnected hoặc context close.

---
