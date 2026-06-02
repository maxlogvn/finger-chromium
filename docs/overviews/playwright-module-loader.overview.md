# Overview: Playwright Module Loader

## Mục tiêu

Tạo generic Loader class resolve package, validate version, trả về property. Tạo playwright-specific instance.

## Kết quả

- `src/loader/index.ts`: 68 dòng, class `Loader`.
- `src/adapter/playwright/loader.ts`: 13 dòng, playwright instance (target 'playwright', min 1.27.1, fallback 'playwright-core').

## Kiểm tra

- `npm run lint` -- 0 errors (2 pre-existing warnings `no-explicit-any` tại loader/index.ts:35, 55).

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### `createRequire(import.meta.url)`

Tạo require function từ ESM context. `import.meta.url` trỏ tới file hiện tại, dùng làm base để resolve relative paths. tsup bundle giữ ESM format nên vẫn hoạt động.

### `module[property] ?? module`

Nếu property không tồn tại (VD: custom module không export chromium), trả về toàn bộ module. Tránh crash, nhưng có thể dẫn đến runtime error nếu code gọi property không có.

### Loader là generic

Có thể dùng cho bất kỳ dependency nào, không chỉ Playwright. Hiện tại chỉ dùng cho Playwright.

### `compare-versions` chỉ hỗ trợ semver

So sánh version string dạng semver. Không support range (>, >=, ...). Chỉ so sánh '<'.

---
