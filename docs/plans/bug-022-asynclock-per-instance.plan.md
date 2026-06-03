# Plan: Chuyển AsyncLock từ module-level sang per-instance

## Các bước thực hiện

- [ ] Bước 1: Thêm class `ConfigManager` vào `src/plugin/config.ts`
    - Làm gì: Tạo class `ConfigManager` với `#lock = new AsyncLock()`. Chuyển logic của `configure()` và `synchronize()` thành method của class. Giữ nguyên `getValidPollInterval()` và các type ở module scope.
    - File liên quan: `src/plugin/config.ts`
    - Ghi chú: Export `ConfigManager` (dạng class), export các type và helper như cũ.

- [ ] Bước 2: Cập nhật `src/plugin/index.ts` — import và dùng `ConfigManager`
    - Làm gì: 
      1. Đổi `import { configure, synchronize } from './config'` thành `import { ConfigManager, ... } from './config'` nếu cần type.
      2. Thêm `#configManager = new ConfigManager()` trong class `FingerprintPlugin`.
      3. Sửa dòng 277: gọi `this.#configManager.configure(...)` và dùng `this.#configManager.synchronize.bind(...)` thay vì `synchronize.bind(...)`.
    - File liên quan: `src/plugin/index.ts`
    - Phụ thuộc: Bước 1 hoàn thành.

- [ ] Bước 3: Kiểm tra
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`.
    - Ghi chú: Đảm bảo không có lỗi type, lint, build, và test pass.

## Kiểm tra

- `npm run lint` — ESLint pass.
- `npm run typecheck` — tsc --noEmit pass.
- `npm run build` — tsup bundle ESM + CJS pass.
- `npm test` — Mocha tests pass.

## Ghi chú

- `PlaywrightFingerprintPlugin.configure()` trong `engine.ts` override hoàn toàn — không liên quan đến `ConfigManager`.
- Không thay đổi API public, không thay đổi hành vi runtime.
