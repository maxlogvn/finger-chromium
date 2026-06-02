# Spec: Hook Binding

## Module: src/adapter/playwright/utils.ts (124 dòng)

### Functions

| Function | Input | Output | Mô tả |
|---|---|---|---|
| `onClose` | Browser or BrowserContext + listener | void | Đăng ký cleanup |
| `bindHooks` | Browser or BrowserContext + Hooks | void | Proxy methods |
| `setViewport` | Page + ViewportBounds | Promise<void> | CDP resize |
| `getViewport` | Page | Promise<{width, height}> | Lấy viewport |

### Constants

```ts
export const MAX_RESIZE_RETRIES = 3;
```

### Type guard

```ts
const isBrowser = (target: unknown): target is Browser => {
  return typeof (target as any)?.version === 'function';
};
```

### Proxy chain

```
Browser.newContext()
  → resetOptions (force viewport: null)
  → patchContext()
    → ctx.newPage()
      → proxy: hooks.onPageCreated(page)
      → patchPage()
        → page.setViewportSize()
          → proxy: warning + no-op
```

### setViewport (adapter version)

```ts
export async function setViewport(page: Page, bounds: { width: number; height: number; diff?: { width: number; height: number } }): Promise<void>
```

- Dùng `page.context().newCDPSession(page)` thay vì `chrome-remote-interface`
- Cùng delta correction algorithm như plugin/browser.ts
- Cùng MAX_RESIZE_RETRIES = 3
