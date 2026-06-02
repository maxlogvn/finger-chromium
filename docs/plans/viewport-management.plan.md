# Plan: Quản lý Viewport

## Các bước thực hiện

- [x] **Bước 1: Tạo `src/plugin/browser.ts`**
  - `setViewport()` dùng CDP `chrome-remote-interface`.
  - `getViewport()` dùng CDP `Runtime.evaluate`.
  - `waitForResize()` dùng CDP `Runtime.evaluate`.
  - Delta correction algorithm, retry max 3.

- [x] **Bước 2: Tạo `src/plugin/config.ts`**
  - `configure()`: đăng ký cleanup, set browser.configure(), gọi ngay.
  - `synchronize()`: 2-phase write (BAS_NOT_SET -> action -> real values).
  - AsyncLock per instance.

- [x] **Bước 3: Tạo `src/adapter/playwright/utils.ts` (phần viewport)**
  - `setViewport()` dùng `page.context().newCDPSession(page)`.
  - `getViewport()` dùng `page.evaluate(scripts.getViewport)`.
  - Cùng delta correction algorithm.

- [x] **Bước 4: In-browser scripts (`src/common/index.ts`)**
  - `waitForResize`: `ResizeObserver` + double `requestAnimationFrame`.
  - `getViewport`: `window.innerWidth/innerHeight`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/browser.ts` | CDP resize (standalone) |
| `src/plugin/config.ts` | configure + synchronize .ini |
| `src/adapter/playwright/utils.ts` | CDP resize (Playwright bridge) |
| `src/common/index.ts` | In-browser scripts |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Cần browser thật để test resize.

---
