# Design: Common Scripts

## Vấn đề

Cần in-browser scripts để:
1. Đợi resize hoàn tất (ResizeObserver + double rAF).
2. Lấy kích thước viewport hiện tại (innerWidth/Height).

Các script này chạy trong browser context qua `page.evaluate()` hoặc CDP `Runtime.evaluate`.

## Giải pháp: Object `scripts`

### `waitForResize`

```ts
() => {
  return new Promise((done) => {
    new ResizeObserver((_, observer) => {
      requestAnimationFrame(() => requestAnimationFrame(() => done(observer.disconnect())));
    }).observe(document.body);
  });
};
```

- `ResizeObserver` disconnect ngay sau lần observe đầu tiên -- tránh memory leak.
- Double `requestAnimationFrame`: lần 1 cho layout, lần 2 cho paint -- đảm bảo kích thước ổn định.

### `getViewport`

```ts
() => ({ width: window.innerWidth, height: window.innerHeight });
```

Dùng `innerWidth` thay `clientWidth` -- fingerprint service dùng `innerWidth` (bao gồm scrollbar).

### Serialization

Scripts được lưu trong object `Record<string, (...args) => unknown>`. Khi cần dùng, truyền trực tiếp vào `page.evaluate()` hoặc gọi `.toString()` cho CDP:

```ts
// Playwright page context
await page.evaluate(scripts.waitForResize);

// CDP Runtime context
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize})()`,
  awaitPromise: true,
});
```

### Tại sao không dùng closure variables?

Scripts chạy trong isolated browser context -- closure variables không được capture. Mọi thứ phải nằm trong function body. Đây là hạn chế của `page.evaluate()`: chỉ chấp nhận function + serializable args.

---

Xem thêm: [Spec](../specs/common-scripts.spec.md) | [Plan](../plans/common-scripts.plan.md)
