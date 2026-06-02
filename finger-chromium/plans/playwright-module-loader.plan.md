# Plan: Playwright Module Loader

## Các bước thực hiện

- [x] **Bước 1: Tạo `src/loader/index.ts`**
  - Class `Loader` với constructor: target, version, fallback packages.

- [x] **Bước 2: Implement static `import()`**
  - Try require từng package trong order.
  - Return `[module, versionString]` hoặc throw Error.

- [x] **Bước 3: Dùng `createRequire` từ `node:module`**
  - ESM compatibility -- require CJS packages.

- [x] **Bước 4: Implement instance `load()`**
  - Gọi `Loader.import()` với [target, ...packages].
  - Validate version với `compare-versions`.
  - Return `module[property] || module`.

- [x] **Bước 5: Tạo `src/adapter/playwright/loader.ts`**
  - Instance cho playwright: target 'playwright', min 1.27.1, fallback 'playwright-core'.

- [x] **Bước 6: Tích hợp vào `engine.ts`**
  - `defaultLoader.load<'chromium'>('chromium')`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/loader/index.ts` | Generic Loader class (68 dòng) |
| `src/adapter/playwright/loader.ts` | Playwright-specific instance (13 dòng) |

## Kiểm tra

- `npm run lint` -- 0 errors.

---
