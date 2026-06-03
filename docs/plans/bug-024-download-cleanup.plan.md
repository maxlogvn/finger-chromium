# Plan: Dọn dẹp file engine corrupt khi download thất bại

## Các bước thực hiện

- [ ] Bước 1: Sửa hàm `download()` — ghi vào file `.tmp` thay vì file đích
    - Làm gì: Đổi `createWriteStream(filePath)` → `createWriteStream(tmpPath)` với `tmpPath = filePath + '.tmp'`.
    - File liên quan: `src/plugin/connector/engine.ts:131`
    - Ghi chú: `tmpPath` là biến local trong function, không ảnh hưởng gì bên ngoài.

- [ ] Bước 2: Restructure try/catch — bắt lỗi toàn bộ và cleanup trong catch
    - Làm gì: Wrap toàn bộ logic (HTTPS + fallback HTTP) trong một `try/catch` duy nhất. Trong `catch`: gọi `fs.unlink(tmpPath).catch(() => {})` rồi throw lại lỗi gốc.
    - File liên quan: `src/plugin/connector/engine.ts:132-144`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành.

- [ ] Bước 3: Thêm `fs.rename(tmpPath, filePath)` sau pipeline thành công
    - Làm gì: Sau khi `await pipeline(response.data, writer)` hoàn tất (ở cả nhánh HTTPS và fallback HTTP), gọi `await fs.rename(tmpPath, filePath)`.
    - File liên quan: `src/plugin/connector/engine.ts:134,140`
    - Ghi chú: Dùng try/catch riêng cho rename, fallback `copyFile` + `unlink` nếu cross-device error.

- [ ] Bước 4: Chạy kiểm tra
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`.
    - Ghi chú: Test với browser thật theo CONVENTIONS.md.

> Mỗi bước nên độc lập và có thể kiểm tra được sau khi hoàn thành.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

## Ghi chú

- `fs.unlink()` trong catch dùng `.catch(() => {})` để tránh throw lỗi cleanup che mất lỗi gốc.
- Cross-device rename error code trên Windows là `EXDEV` — dùng `code === 'EXDEV'` để phát hiện và fallback.
- File `.tmp` được tạo cùng thư mục với file đích nên cross-device ít xảy ra, nhưng vẫn cần xử lý để tránh bug tiềm ẩn.
