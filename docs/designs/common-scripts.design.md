# Design: Common Scripts

## Vấn đề

Cần in-browser scripts để:
1. Đợi resize hoàn tất (ResizeObserver + rAF)
2. Lấy kích thước viewport hiện tại (innerWidth/Height)

Các script này được chạy trong browser context qua `page.evaluate()` hoặc CDP `Runtime.evaluate`.

## Giải pháp: Object `scripts`

### waitForResize

```ts
function waitForResize() {
  return new Promise<void>((resolve) => {
    const ro = new ResizeObserver(() => {
      ro.disconnect();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    ro.observe(document.body);
  });
}
```

- ResizeObserver disconnect ngay sau lần observe đầu tiên
- Double requestAnimationFrame đảm bảo layout đã ổn định (1 rAF cho layout, 1 rAF cho paint)

### getViewport

```ts
function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
```

## Serialization

Scripts được lưu trong object `Record<string, (...args) => unknown>`. Khi cần dùng, gọi `.toString()` để lấy function body và truyền vào `page.evaluate()` hoặc CDP `Runtime.evaluate`.

```ts
// adapter/utils.ts
await page.evaluate(scripts.waitForResize);

// plugin/browser.ts (CDP)
await cdp.Runtime.evaluate({
  expression: `(${scripts.getViewport.toString()})()`,
});
```

---

Xem thêm: [Spec](../specs/common-scripts.spec.md) | [Plan](../plans/common-scripts.plan.md)
