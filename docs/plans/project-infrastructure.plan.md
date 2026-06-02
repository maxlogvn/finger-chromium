# Plan: Hạ tầng dự án

- [x] Bước 1: Tạo package.json với scripts (lint, test, build, dev, format)
- [x] Bước 2: Cấu hình tsconfig (strict mode, target ES2022, paths alias @src)
- [x] Bước 3: Cấu hình tsup (ESM+CJS, external, dts)
- [x] Bước 4: Cấu hình ESLint + Prettier (tabs, single quotes)
- [x] Bước 5: Cấu hình Mocha + tsx
- [x] Bước 6: Tạo cấu trúc thư mục src/, docs/
- [x] Bước 7: Tạo index.ts re-export public API

## Vấn đề còn tồn đọng

- `npm run clean` dùng `rm -rf` -- không chạy trên Windows. Cần sửa thành `node:fs` `rmSync`.
