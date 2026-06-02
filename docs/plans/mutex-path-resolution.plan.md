# Plan: Mutex Path Resolution

## Các bước thực hiện

- [x] Bước 0: Cập nhật ROADMAP.md -- đánh dấu "Đang làm"
- [x] Bước 1: Viết design doc
- [x] Bước 2: Viết spec doc
- [x] Bước 3: Viết plan doc (file này)
- [ ] Bước 4: Sửa `src/plugin/mutex/index.ts`
  - Thêm hàm `resolvePackageRoot(startDir)`
  - Thay `path.resolve(__dirname, '../../../')` bằng `resolvePackageRoot(path.dirname(__filename))`
  - Xoá biến `__dirname` không còn dùng
- [ ] Bước 5: Chạy `npm run build` -- rebuild dist
- [ ] Bước 6: Chạy `npm run lint` -- kiểm tra ESLint
- [ ] Bước 7: Chạy `npm test` -- kiểm tra Mocha tests
- [ ] Bước 8: Viết overview doc
- [ ] Bước 9: Cập nhật ROADMAP.md -- đánh dấu "Hoàn thành"

## Kiểm tra

```bash
npm run build    # tsup bundle -> dist/
npm run lint     # ESLint
npm test         # Mocha
```

## Ghi chú

- Đây là bug fix (non-feature task), không cần product doc.
- Hàm `resolvePackageRoot` dùng `createRequire` giống `engine.ts`.
- Mutex được khởi tạo ở top-level scope, nếu hàm walk-up fail sẽ crash sớm với message rõ ràng.
- Không có test unit riêng cho `resolvePackageRoot` vì test browser thật không phù hợp để test path resolve. Thay vào đó, verify bằng `npm run build` + kiểm tra dist output.

---

