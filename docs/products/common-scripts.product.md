# Product: Common Scripts

## Mô tả

Common Scripts cung cấp 2 hàm JavaScript chạy trong browser qua `page.evaluate()` hoặc CDP `Runtime.evaluate`. Các script này hỗ trợ resize viewport — được dùng nội bộ bởi `BrowserEngine` khi thay đổi kích thước viewport theo fingerprint.

## Cách sử dụng

```ts
import { scripts } from './src/common';

// Playwright context
await page.evaluate(scripts.waitForResize);
const vp = await page.evaluate(scripts.getViewport);

// CDP context
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize})()`,
  awaitPromise: true,
});
```

## Hành vi chi tiết

- `waitForResize`: ResizeObserver detect thay đổi kích thước → disconnect ngay (tránh memory leak) → double `requestAnimationFrame` (lần 1 layout, lần 2 paint).
- `getViewport`: dùng `window.innerWidth` thay `clientWidth`. Lý do: fingerprint service dùng `innerWidth` (bao gồm scrollbar) để xác định viewport.
- Scripts được lưu dạng function object. Khi dùng với CDP, gọi `.toString()` để serialize thành string.
- Closure variables không được capture — mọi thứ trong function body. Điều này đảm bảo script hoạt động đúng khi evaluate ở remote context.

## Giới hạn và điều kiện

- `waitForResize` treo vô hạn nếu không có resize — cần timeout ở caller.
- Chỉ gọi scripts sau khi page đã load (`DOMContentLoaded`).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/common-scripts.spec.md`
- Design: `docs/designs/common-scripts.design.md`
- Source: `src/common/index.ts`
