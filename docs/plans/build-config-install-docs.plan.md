# Plan: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

## Các bước thực hiện

- [X] **Bước 1: Cập nhật ROADMAP** -- Đánh dấu "Đang làm".
- [X] **Bước 2: Sửa package.json**
  - [X] `clean`: `rm -rf dist` -> `tsup --clean`
  - [X] `build`: `npm run clean && tsup` -> `tsup`
  - [X] `prepare`: thêm `npm run build`
- [X] **Bước 3: Chạy build kiểm tra** -- `npm run build`.
- [X] **Bước 4: Cập nhật README.md** -- Thêm prepare note.
- [X] **Bước 5: Cập nhật product doc** -- Sửa lệnh cài đặt + thêm prepare note.
- [X] **Bước 6: Cập nhật design doc** -- Sửa lệnh cài đặt + fix rm note.
- [X] **Bước 7: Cập nhật spec doc** -- Cập nhật bảng scripts + fix rm note.
- [X] **Bước 8: Fix debug-logging.spec.md** -- Fix tiếng Việt thiếu dấu.
- [X] **Bước 9: Cập nhật overview doc** -- Sửa rm note.
- [X] **Bước 10: Cập nhật Welcome.md** -- Sửa rm note.
- [X] **Bước 11: Chạy kiểm tra** -- `npm run lint` + `npm run build`.
- [X] **Bước 12: Commit và push** -- `git add` + `git commit` + `git push` (commits 086c928, 9a63a00, 06efd88).
- [X] **Bước 13: Viết overview** -- `overviews/build-config-install-docs.overview.md`.
- [X] **Bước 14: Cập nhật ROADMAP** -- Đánh dấu "Hoàn thành".

## Kiểm tra

- `npm run lint` -- 0 errors.
- `npm run build` -- tsup build thành công.

## Ghi chú

- Task này là non-feature (bảo trì), chỉ cần overview, không cần product doc.
- Tất cả thay đổi trên cùng một nhánh `development`.
- Không cần chạy `npm test` vì không có thay đổi logic.

---

