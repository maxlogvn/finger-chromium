# Plan: Bug #10 — Import path alias `'src/types/fetch'` không khớp tsconfig

## Các bước thực hiện

- [ ] Bước 1: Đổi import path trong `chromium.ts`
    - Làm gì: Sửa `import type { FetchOptions } from 'src/types/fetch'` thành `import type { FetchOptions } from '../../types/fetch'`.
    - File liên quan: `src/adapter/playwright/chromium.ts:24`.
    - Ghi chú: Các import type khác trong cùng file đều dùng relative path `'../../types/...'`.

- [ ] Bước 2: Chạy kiểm tra
    - Làm gì: Chạy `npm run lint` + `npm run typecheck` + `npm run build` để xác nhận không lỗi.
    - File liên quan: —
    - Phụ thuộc: Bước 1 hoàn thành.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Ghi chú

- Đây là fix đơn giản, chỉ sửa 1 dòng.
- Không cần chạy `npm test` vì không có unit test cho import path (mà lint + typecheck đã đủ để verify).
