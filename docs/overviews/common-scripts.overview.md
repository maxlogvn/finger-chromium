# Overview: Common Scripts (In-browser)

## Tóm tắt

Đã tạo 2 in-browser scripts (`waitForResize`, `getViewport`) trong `src/common/index.ts`, export qua object `scripts`. Dùng qua `page.evaluate()` hoặc CDP `Runtime.evaluate`.

## Kiến trúc

```
src/common/index.ts
  |-- scripts = { waitForResize, getViewport } as const
  |
  |-- waitForResize: string
  |     IIFE async -> ResizeObserver + requestAnimationFrame fallback
  |
  |-- getViewport: string
  |     IIFE -> { width: window.innerWidth, height: window.innerHeight }
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `scripts` object | `src/common/index.ts` | 16-18 |
| `waitForResize` source | `src/common/index.ts` | 20-33 |
| `getViewport` source | `src/common/index.ts` | 35-44 |

## Script source

**waitForResize:**
```js
(async () => {
  const waitForResize = () => new Promise((resolve) => {
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      resolve(undefined);
    });
    observer.observe(document.documentElement);
    raf = requestAnimationFrame(() => {
      observer.disconnect();
      resolve(undefined);
    });
  });
  await waitForResize();
})()
```

**getViewport:**
```js
(() => {
  return { width: window.innerWidth, height: window.innerHeight };
})()
```

## Quyết định thiết kế

- **`as const` object**: TypeScript infer literal type -- không cho mutate scripts object.
- **ResizeObserver + RAF fallback**: ResizeObserver bắt resize chính xác. RAF fallback tránh treo vô hạn nếu resize không xảy ra.
- **`window.innerWidth/innerHeight`**: Trả về viewport CSS pixels -- khác `window.outerWidth` (cả chrome). Chính xác cho responsive layout detection.
- **Double RAF**: `waitForResize` dùng một RAF làm fallback. Kỹ thuật double RAF (dùng ở nơi khác) đảm bảo layout + paint đã hoàn tất.

## Edge cases

- `document` undefined (worker context) -> ResizeObserver not supported -> throw.
- `document.documentElement` null (no `<html>`) -> observer chờ -> RAF fallback -> resolve.
- `ResizeObserver` không hỗ trợ (old browser) -> RAF fallback -> resolve.
- `cancelAnimationFrame(raf)` tránh memory leak nếu resize xảy ra trước RAF.

## Lưu ý

- Scripts là string -- inject qua `page.evaluate()` hoặc `Runtime.evaluate()`.
- `waitForResize` async -- caller cần `await`.
- `getViewport` synchronous -- gọi sync.
- Double rAF: lần 1 cho layout, lần 2 cho paint. Đảm bảo innerWidth/Height đã cập nhật.

## Tài liệu liên quan

- `docs/designs/common-scripts.design.md`
- `docs/specs/common-scripts.spec.md`
- `docs/plans/common-scripts.plan.md`
- `docs/products/common-scripts.product.md`
- `src/common/index.ts`
