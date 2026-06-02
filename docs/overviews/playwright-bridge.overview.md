# Overview: Playwright Bridge

File: `src/adapter/playwright/engine.ts` (111 dòng).

## Lưu ý kỹ thuật

- `defaultLoader.load<'chromium'>('chromium')` gọi `createRequire` để require `playwright` hoặc `playwright-core`. Kết quả là `BrowserType` interface của Playwright.
- `_launch(false, ...)` -- tham số `false` rất quan trọng. Nếu truyền `true`, nó sẽ spawn `worker.exe` trực tiếp thay vì dùng Playwright launcher, dẫn đến mất hết Playwright functionality (không có `BrowserContext`, `page`, v.v.).
- `configure()` override nhận `browser` là `BrowserContext` nhưng type signature ghi là `Browser`. Đây là technical debt -- cần refactor type.
- `onClose()` dùng `'disconnected'` event cho Browser, `'close'` cho BrowserContext. Phân biệt bằng type guard `isBrowser()` (kiểm tra `'version' in target`).
- `UNSUPPORTED_OPTIONS` throw error chứ không silent ignore -- tránh user tưởng option hoạt động nhưng thực tế không.
