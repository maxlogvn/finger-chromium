# Product: Common Scripts

## Tổng quan

2 in-browser scripts được dùng qua `page.evaluate()` hoặc CDP `Runtime.evaluate` để hỗ trợ resize viewport.

## `waitForResize`

Dùng ResizeObserver + double requestAnimationFrame để đợi layout ổn định:

```ts
await page.evaluate(scripts.waitForResize);
// Lúc này: layout + paint đã hoàn tất, viewport ổn định
```

**Cơ chế**: ResizeObserver detect thay đổi kích thước -> disconnect ngay (tránh leak) -> double rAF (lần 1 layout, lần 2 paint).

## `getViewport`

Lấy kích thước viewport thực tế:

```ts
const { width, height } = await page.evaluate(scripts.getViewport);
// { width: window.innerWidth, height: window.innerHeight }
```

**Dùng `innerWidth` thay `clientWidth`**: viewport fingerprint dùng `innerWidth` (bao gồm scrollbar).

## Dùng qua CDP

```ts
// plugin/browser.ts -- khi không có page handle
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize})()`,
  awaitPromise: true,
});
```

## Lưu ý

- Scripts chạy trong browser context -- không thể dùng closure variables.
- `waitForResize` treo vô hạn nếu không có resize -- cần timeout ở caller.
- Chỉ gọi scripts sau khi page đã load (`DOMContentLoaded`).

---
