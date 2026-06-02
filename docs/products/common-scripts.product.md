# Product: Common Scripts

## Tổng quan

2 in-browser scripts chạy trong browser context để hỗ trợ resize viewport.

## Scripts

### waitForResize

Đợi resize hoàn tất bằng ResizeObserver + double requestAnimationFrame.

```ts
await page.evaluate(scripts.waitForResize);
// Lúc này layout đã ổn định
```

### getViewport

Lấy kích thước viewport chính xác.

```ts
const { width, height } = await page.evaluate(scripts.getViewport);
```

## Cơ chế double rAF

Một rAF chưa đủ vì browser có thể chưa kịp layout lại. Double rAF đảm bảo layout và paint đã hoàn tất.
