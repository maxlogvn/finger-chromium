# Plan: Common Scripts

## Các bước thực hiện

- [x] **Bước 1: Viết `waitForResize` function**
  - `ResizeObserver` trên `document.body`, disconnect ngay sau observe -> double `requestAnimationFrame`.

- [x] **Bước 2: Viết `getViewport` function**
  - `return { width: window.innerWidth, height: window.innerHeight }`.
  - Dùng `innerWidth` thay `clientWidth` -- fingerprint service dùng `innerWidth`.

- [x] **Bước 3: Export `scripts` object**
  - Type: `Record<string, (...args: unknown[]) => unknown>`.
  - Scripts self-contained -- không closure variables.

## File liên quan

| File | Vai trò |
|---|---|
| `src/common/index.ts` | 2 scripts (25 dòng) |
| `src/plugin/browser.ts` | CDP Runtime.evaluate |
| `src/adapter/playwright/utils.ts` | page.evaluate |

## Kiểm tra

- `npm run lint` -- 0 errors.

---
