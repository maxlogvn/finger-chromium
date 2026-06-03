# Plan: Bug #17 — `synchronize` ghi `BAS_NOT_SET` cho `availWidth/availHeight`

## Các bước thực hiện

- [ ] Bước 1: Sửa `src/plugin/config.ts`
    - Làm gì: Đổi loop `for (const key of ['availWidth', 'availHeight'])` thành `for (const [iniKey, boundsKey] of [['availWidth', 'width'], ['availHeight', 'height']])` và dùng `bounds[boundsKey]` thay vì `bounds[iniKey]`.
    - File liên quan: `src/plugin/config.ts:73-81`

- [ ] Bước 2: Kiểm tra
    - Làm gì: Chạy `npm run lint` + `npm run build`.

## Kiểm tra

- `npm run lint` — không lỗi ESLint.
- `npm run build` — bundle thành công.
