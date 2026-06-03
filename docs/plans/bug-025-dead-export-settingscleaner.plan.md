# Plan: Dead export SettingsCleaner default

## Các bước thực hiện

- [ ] Bước 1: Thêm `@deprecated` JSDoc cho default export trong cleaner.ts
    - Làm gì: Thêm JSDoc block phía trên dòng `export default new SettingsCleaner()` với thẻ `@deprecated`, giải thích lý do và hướng dẫn thay thế.
    - File liên quan: `src/plugin/cleaner.ts:117-118`
    - Ghi chú: JSDoc phải theo chuẩn `@deprecated` — ghi rõ từ version nào deprecated, dùng gì để thay thế.

- [ ] Bước 2: Refactor test quit-cleanup.test.ts
    - Làm gì: Đổi `import cleaner from '../src/plugin/cleaner'` thành `import { SettingsCleaner } from '../src/plugin/cleaner'`. Trong `describe('cleaner', ...)` block, tạo `const cleaner = new SettingsCleaner()` để dùng trong test.
    - File liên quan: `tests/quit-cleanup.test.ts:20,51-60`
    - Phụ thuộc: Sau bước 1 (để JSDoc đã có sẵn dù không ảnh hưởng đến logic).

- [ ] Bước 3: Chạy kiểm tra
    - Làm gì: Chạy `npm run lint`, `npm run typecheck` và `npm test` để đảm bảo không lỗi.
    - File liên quan: — (chạy lệnh)
    - Phụ thuộc: Sau bước 2.
    - Ghi chú: Nếu test fail, sửa lỗi và chạy lại.

## Kiểm tra

- `npm run lint` — ESLint không báo lỗi mới.
- `npm run typecheck` — TypeScript type-check pass.
- `npm test` — tất cả test pass, đặc biệt `quit-cleanup.test.ts`.

## Ghi chú

- Đây là documentation-only change cho production code (chỉ thêm JSDoc). Logic không thay đổi.
- Backward compatibility được giữ nguyên: `export default new SettingsCleaner()` vẫn tồn tại, ai import sai vẫn hoạt động — chỉ có warning qua JSDoc.
- Kế hoạch xoá hoàn toàn: major version 2.0.
