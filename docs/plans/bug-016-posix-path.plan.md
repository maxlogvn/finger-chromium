# Plan: Bug #16 — `cleaner` dùng `posix` path trên Windows

## Các bước thực hiện

- [ ] Bước 1: Sửa import path trong `cleaner.ts`
    - Làm gì: Đổi `import { posix as path } from 'path'` → `import path from 'node:path'`.
    - File liên quan: `src/plugin/cleaner.ts:12`

- [ ] Bước 2: Kiểm tra
    - Làm gì: Chạy `npm run lint` + `npm run build`.

## Kiểm tra

- `npm run lint` — không lỗi ESLint.
- `npm run build` — bundle thành công.
