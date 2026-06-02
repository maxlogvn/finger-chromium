# Plan: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

## Các bước thực hiện

- [x] Bước 1: Cập nhật ROADMAP -- đánh dấu "Đang làm"
- [x] Bước 2: Sửa `package.json`
    - Làm gì: `clean` -> `tsup --clean`, `build` -> `tsup`, thêm `prepare`
- [x] Bước 3: Chạy build kiểm tra -- `npm run build`
- [x] Bước 4-10: Cập nhật tài liệu liên quan (README.md, product, design, spec, overview, Welcome.md, ROADMAP.md)
- [x] Bước 11: Chạy kiểm tra -- `npm run lint` + `npm run build`
- [x] Bước 12: Commit và push
- [x] Bước 13: Viết overview
- [x] Bước 14: Cập nhật ROADMAP -- đánh dấu "Hoàn thành"

## Kiểm tra

- `npm run lint` -- 0 errors.
- `npm run build` -- tsup build thành công.

## Ghi chú

- Non-feature task: chỉ cần overview, không cần product doc.
