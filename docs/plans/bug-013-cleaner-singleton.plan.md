# Plan: Bug #13 -- Cleaner singleton dùng chung giữa các BrowserEngine instance

## Các bước thực hiện

- [ ] Bước 1: Sửa `src/plugin/cleaner.ts` -- thêm named export cho `SettingsCleaner` class
    - Làm gì: Thêm `export` trước `class SettingsCleaner`. Giữ nguyên `export default new SettingsCleaner()` ở cuối file.
    - File liên quan: `src/plugin/cleaner.ts`
    - Ghi chú: Cú pháp: `export class SettingsCleaner { ... }` -- vừa là named export vừa dùng cho default export.

- [ ] Bước 2: Sửa `src/plugin/index.ts` -- dùng instance cleaner riêng
    - Làm gì:
      1. Đổi `import cleaner from './cleaner'` thành `import { SettingsCleaner } from './cleaner'`.
      2. Thêm `#cleaner = new SettingsCleaner()` vào class `FingerprintPlugin`.
      3. Đổi các lệnh gọi `cleaner.watch(...)` → `this.#cleaner.watch(...)`.
      4. Đổi `cleaner.include(...)` → `this.#cleaner.include(...)`.
      5. Đổi `cleaner.stop()` → `this.#cleaner.stop()`.
    - File liên quan: `src/plugin/index.ts`

- [ ] Bước 3: Kiểm tra
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, và `npm test`.
    - Phụ thuộc: Yêu cầu bước 1 và 2 hoàn thành.

## Kiểm tra

- `npm run lint` -- ESLint không báo lỗi.
- `npm run typecheck` -- TypeScript type check pass.
- `npm test` -- tất cả test pass, đặc biệt `quit-cleanup.test.ts`.
- Kiểm tra thủ công: import `cleaner` (singleton) từ `src/plugin/cleaner` vẫn hoạt động (backward compatible).

## Ghi chú

- `SettingsCleaner` class có private fields (`#timer`, `#folders`) -- cần đảm bảo `export class` vẫn giữ được private field semantics.
- Singleton `export default new SettingsCleaner()` vẫn tồn tại -- test cũ không cần sửa.
