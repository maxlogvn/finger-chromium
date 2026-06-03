# Plan: Bug #11 — `defaultLauncher` mutable state

## Các bước thực hiện

- [ ] Bước 1: Sửa `src/adapter/playwright/engine.ts` — xoá module-level state, thêm factory function, sửa constructor
    - Làm gì: Xoá `browserType` và `defaultLauncher` khỏi module scope. Thêm `createDefaultLauncher()` function. Sửa constructor dùng `launcher ?? createDefaultLauncher()`
    - File liên quan: `src/adapter/playwright/engine.ts`

- [ ] Bước 2: Sửa `src/adapter/playwright/chromium.ts` — thêm `launcher?` param vào constructor
    - Làm gì: Thêm `launcher?: Launcher` vào constructor, truyền vào `new PlaywrightFingerprintPlugin(launcher)`
    - File liên quan: `src/adapter/playwright/chromium.ts`
    - Phụ thuộc: Bước 1

- [ ] Bước 3: Chạy kiểm tra
    - Làm gì: `npm run lint` + `npm run typecheck` + `npm run build` + `npm test`
    - Ghi chú: Mọi test hiện có phải pass

- [ ] Bước 4: Rà soát tài liệu liên quan
    - Làm gì: Cập nhật KNOWN_ISSUES.md, docs bị ảnh hưởng

- [ ] Bước 5: Viết overview

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
- Xác nhận `new BrowserEngine()` không throw
- Xác nhận `new BrowserEngine(mockLauncher)` inject được mock

## Ghi chú

- `defaultLoader` (`loader.ts`) vẫn là module-level singleton — đó là config strings, không phải vấn đề
- Import `Launcher` type trong `chromium.ts` đã có sẵn — không cần thêm
