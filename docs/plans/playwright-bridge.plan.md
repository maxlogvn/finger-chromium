# Plan: Playwright Bridge

## Các bước thực hiện

- [x] **Bước 1: Tạo file `src/adapter/playwright/engine.ts`**
  - Import `FingerprintPlugin` từ `../../plugin`.
  - Import `defaultLoader` từ `./loader` để load Playwright module.
  - Import `bindHooks`, `getViewport`, `onClose`, `setViewport` từ `./utils`.

- [x] **Bước 2: Định nghĩa hằng số**
  - `IGNORED_ARGUMENTS = ['--disable-extensions']` -- loại bỏ khỏi args.
  - `UNSUPPORTED_OPTIONS = ['proxy', 'channel', 'firefoxUserPrefs']` -- chặn các option không hỗ trợ.
  - `LAUNCH_FALLBACK_WARNING` -- warning text cho `launch()` fallback.

- [x] **Bước 3: Tạo defaultLauncher**
  - Load BrowserType từ Playwright.
  - Bind `launch` và `launchPersistentContext`.

- [x] **Bước 4: Class `PlaywrightFingerprintPlugin`**
  - Extends `FingerprintPlugin`.
  - Property `pwLauncher: Launcher`.
  - Constructor nhận optional launcher, mặc định là `defaultLauncher`.

- [x] **Bước 5: Override `launch()`**
  - Validate options.
  - In warning.
  - Fallback sang `launchPersistentContext('', options)`.

- [x] **Bước 6: Override `launchPersistentContext()`**
  - Validate options.
  - Filter `--user-data-dir` khỏi args.
  - Tạo custom launcher gọi `pwLauncher.launchPersistentContext`.
  - Gọi `_launch(false, ...)` với custom launcher.
  - Xử lý `ignoreDefaultArgs`.

- [x] **Bước 7: Override `configure()`**
  - Cast browser thành BrowserContext.
  - `onClose(context, cleanup)` -- lắng nghe close event.
  - `bindHooks(context, { onPageCreated: resize })` -- resize page mới.
  - Resize page đầu tiên nếu đã có.

- [x] **Bước 8: Private `#validateOptions()`**
  - Duyệt `UNSUPPORTED_OPTIONS`, throw Error nếu có.

## File liên quan

| File | Vai trò |
|---|---|
| `src/adapter/playwright/engine.ts` | Bridge class (111 dòng) |
| `src/adapter/playwright/loader.ts` | Loader Playwright module |
| `src/adapter/playwright/utils.ts` | onClose, bindHooks, setViewport, getViewport |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Cần playwright installed để test.

---
