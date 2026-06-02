# Plan: Playwright Module Loader

- [x] Bước 1: Tạo Loader class (target, version, fallback packages)
- [x] Bước 2: Implement static import() -- try require từng package, return [module, version]
- [x] Bước 3: Dùng createRequire từ node:module (ESM compatibility)
- [x] Bước 4: Implement load() -- gọi import(), validate version, trả về property
- [x] Bước 5: Dùng compare-versions library cho version check
- [x] Bước 6: Tạo playwright loader instance (target 'playwright', min 1.27.1, fallback 'playwright-core')
- [x] Bước 7: Tích hợp vào engine.ts: defaultLoader.load('chromium')

## Edge cases cần xử lý

- `import()` nhận packages rỗng → return undefined (không throw)
- `load()` khi property không tồn tại trong module → fallback về module gốc
- `compare-versions` so sánh version string, không support semver range
- `createRequire` chỉ hoạt động trong ESM context -- nếu file là CJS, dùng require trực tiếp
