# Overview: Playwright Module Loader

File: `src/loader/index.ts` (68 dòng) + `src/adapter/playwright/loader.ts` (13 dòng).

## Lưu ý kỹ thuật

- `createRequire(import.meta.url)` tạo require function từ ESM. `import.meta.url` trỏ tới file hiện tại, dùng làm base để resolve relative paths. Nếu bundle bằng tsup, `import.meta.url` vẫn hoạt động vì tsup giữ ESM format.
- `compare(version, this.version, '<')` chỉ kiểm tra version hiện tại có nhỏ hơn minimum không. Nếu version lớn hơn hoặc bằng, pass. Không kiểm tra major version breaking changes.
- `module[property] ?? module`: nếu property không tồn tại (vd: custom module không export chromium), trả về toàn bộ module. Tránh crash, nhưng có thể dẫn đến runtime error nếu code gọi property không có.
- Loader là generic -- có thể dùng cho bất kỳ dependency nào, không chỉ Playwright. Nhưng hiện tại chỉ dùng cho Playwright.
