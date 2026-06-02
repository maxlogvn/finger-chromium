# Spec: Common Scripts

## File: `src/common/index.ts` (25 dòng)

### Export

```ts
export const scripts: Record<string, (...args: unknown[]) => unknown>;
```

### `waitForResize`

| Thuộc tính | Giá trị |
|---|---|
| Type | `() => Promise<void>` |
| Mechanism | `ResizeObserver` trên `document.body` + double `requestAnimationFrame` |
| Use case | `page.evaluate(scripts.waitForResize)` sau khi resize viewport |

### `getViewport`

| Thuộc tính | Giá trị |
|---|---|
| Type | `() => { width: number; height: number }` |
| Return | `{ width: window.innerWidth, height: window.innerHeight }` |
| Use case | Xác nhận kích thước sau resize |

### Usage patterns

```ts
// Playwright page context
await page.evaluate(scripts.waitForResize);
const vp = await page.evaluate(scripts.getViewport);

// CDP Runtime context (plugin/browser.ts)
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize})()`,
  awaitPromise: true,
});
```

---

## Kiểm tra

- Scripts chạy sau khi page đã load (`DOMContentLoaded`).
- `waitForResize` không có timeout -- caller nên wrapper với timeout riêng.

---
