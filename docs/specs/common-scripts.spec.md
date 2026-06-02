# Spec: Common Scripts

## Mô tả

In-browser scripts dùng qua `page.evaluate()`.

## Scripts

| Tên | Logic | Mục đích |
|---|---|---|
| `waitForResize` | ResizeObserver + double rAF | Đợi resize hoàn tất |
| `getViewport` | `window.innerWidth/Height` | Lấy viewport |

## Usage

```ts
await page.evaluate(scripts.waitForResize);
const viewport = await page.evaluate(scripts.getViewport);
```

---

Xem thêm: [Design](../designs/common-scripts.design.md) | [Plan](../plans/common-scripts.plan.md)
