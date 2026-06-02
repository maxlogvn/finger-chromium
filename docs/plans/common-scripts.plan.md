# Plan: Common Scripts (In-browser)

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa scripts object** (file: `src/common/index.ts`, dòng 16-18)

    **Signature:**
    ```ts
    export const scripts = {
      waitForResize: string,  // function source code
      getViewport: string,    // function source code
    } as const;
    ```

    **Tại sao:** Object `as const` — TypeScript infer literal type, không cho mutate.

- [x] **Bước 2: Implement waitForResize** (file: `src/common/index.ts`, dòng 20-33)

    **Source:**
    ```ts
    waitForResize = `
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
    `;
    ```

    **Logic chi tiết:**
    1. `ResizeObserver` watch `document.documentElement`.
    2. `requestAnimationFrame` fallback timeout → disconnect observer nếu resize không xảy ra.
    3. Nếu resize event xảy ra trước RAF → cancel RAF → `resolve()`.
    4. Nếu RAF fires trước resize → `resolve()` (timeout).

    **Edge cases:**
    - `document` undefined (worker context) → ResizeObserver not supported → throw (caught by caller).
    - `document.documentElement` null (no `<html>`) → ResizeObserver chờ element → RAF fallback.
    - `ResizeObserver` không hỗ trợ (old browser) → RAF fallback chạy → resolve.

    **Tại sao:** ResizeObserver bắt resize chính xác, RAF fallback tránh treo vô hạn. `cancelAnimationFrame` tránh memory leak.

- [x] **Bước 3: Implement getViewport** (file: `src/common/index.ts`, dòng 35-44)

    **Source:**
    ```ts
    getViewport = `
      (() => {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      })()
    `;
    ```

    **Tại sao:** `window.innerWidth/innerHeight` trả về viewport CSS pixels — khác `window.outerWidth` (cả chrome). Chính xác cho responsive layout detection.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- Scripts là string — inject qua CDP `Runtime.evaluate()`.
- `waitForResize` dùng IIFE async → chờ promise resolve.
- `getViewport` synchronous — trả về object `{ width, height }`.
- Không dùng `document.documentElement.clientWidth` — có scrollbar size.
