# Spec: Common Scripts

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Common Scripts cung cấp 2 hàm JavaScript chạy trong browser context qua `page.evaluate()` (Playwright) hoặc CDP `Runtime.evaluate` (plugin path). Dùng để hỗ trợ resize viewport: `waitForResize` đợi layout/paint ổn định, `getViewport` đọc kích thước thực tế.

Source: `src/common/index.ts` (23 dòng).

## Yêu cầu

- `waitForResize` — ResizeObserver phát hiện thay đổi kích thước → disconnect observer → double `requestAnimationFrame` (lần 1 layout, lần 2 paint).
- `getViewport` — trả về `{ width: window.innerWidth, height: window.innerHeight }`.
- Scripts phải self-contained — không closure variables, vì chạy trong isolated browser context qua `page.evaluate()` hoặc `cdp.Runtime.evaluate()`.
- Object `scripts` có type `Record<string, (...args: unknown[]) => unknown>`.

## Thiết kế

```ts
scripts.waitForResize = () => {
  return new Promise((done) => {
    new ResizeObserver((_, observer) => {
      requestAnimationFrame(() => requestAnimationFrame(() => done(observer.disconnect())));
    }).observe(document.body);
  });
};

scripts.getViewport = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});
```

### Tại sao double requestAnimationFrame?

`requestAnimationFrame` lần 1: browser đã cập nhật layout mới. Lần 2: browser đã paint xong. Nếu chỉ một lần, có thể layout chưa ổn định — `getViewport()` trả về kích thước cũ.

### Tại sao dùng innerWidth thay vì clientWidth?

Fingerprint service dùng `window.innerWidth` (bao gồm scrollbar) để xác định viewport. `clientWidth` không bao gồm scrollbar — sai lệch so với fingerprint data.

### Tại sao disconnect ResizeObserver ngay?

ResizeObserver giữ reference đến callback và element. Nếu không disconnect, nó tồn tại mãi — memory leak trong page context.

Tham chiếu design doc: `docs/designs/common-scripts.design.md`.

## API / Data flow

```ts
import { scripts } from '../../common';

// Playwright path
await page.evaluate(scripts.waitForResize);
const vp = await page.evaluate(scripts.getViewport);
// vp = { width: 1280, height: 720 }

// CDP path (plugin)
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize})()`,
  awaitPromise: true,
});
```

### Input / Output

| Script | Input | Output |
|---|---|---|
| `waitForResize` | none | `Promise<void>` — resolve sau khi resize hoàn tất |
| `getViewport` | none | `{ width: number, height: number }` |

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/common/index.ts` | Object `scripts` với 2 function | 25 |
| `src/plugin/browser.ts` | Dùng CDP `Runtime.evaluate` gọi scripts | 76 |
| `src/adapter/playwright/utils.ts` | Dùng `page.evaluate` gọi scripts | 114 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `waitForResize` không timeout | Caller phải tự wrap timeout nếu cần — promise treo vô hạn nếu resize không xảy ra |
| `document.body` chưa tồn tại (page chưa load) | ResizeObserver không thể observe `body` — throw error |
| Gọi qua CDP mà script có closure | Lỗi — script không serialize được. Không xảy ra vì scripts self-contained. |

## Kiểm tra

- Happy path: `waitForResize` resolve sau resize → `getViewport` trả về kích thước đúng.
- Edge case: cùng kích thước (resize không đổi) → ResizeObserver không fire → promise treo vô hạn.
- Error: gọi trước khi page load → ResizeObserver throw.
- CDP: `(${scripts.waitForResize})()` — function được `.toString()` serialize đúng.
