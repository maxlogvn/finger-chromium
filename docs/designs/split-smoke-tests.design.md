# Design: Chia tách Smoke Tests E2E

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06
> **Người viết:** AI | **Người phản biện:** chờ duyệt

## Bối cảnh

File `tests/smoke/browser-engine.spec.ts` (129 dòng) hiện chứa 4 nhóm test không liên quan với nhau, chỉ dùng chung import từ `tests/helpers.ts`. Việc gộp chung một file khiến việc chạy test riêng lẻ khó khăn, tăng nguy cơ conflict khi nhiều người cùng phát triển smoke test.

Mỗi nhóm test đã độc lập hoàn toàn (không shared state, không shared fixture), nên tách ra là bước tái cấu trúc đơn giản.

## Câu hỏi làm rõ

1. **Câu hỏi:** Có cần giữ file gốc làm barrel re-export không?
   → **Trả lời:** Không, xoá file gốc, tạo 4 file riêng. Mocha discovery sẽ nhặt tất cả `*.spec.ts` trong `tests/smoke/`.

2. **Câu hỏi:** Có cần thêm `tests/smoke/.mocharc.yml` để include pattern không?
   → **Trả lời:** Không cần. Mocha config hiện tại (`.mocharc.yml` ở root) đã dùng `spec './tests/**/*.spec.ts'` nên tự động nhặt file mới.

## Các phương án

### Phương án 1: Tách 4 file riêng, giữ nguyên helpers

Chia mỗi `describe` block thành một file `*.spec.ts` riêng trong cùng thư mục `tests/smoke/`, xoá file gốc.

- **Ưu điểm:** Đơn giản, mỗi file ~10-47 dòng, dễ bảo trì.
- **Nhược điểm:** Import `helpers` lặp lại ở cả 4 file.
- **Rủi ro:** Thấp — không thay đổi logic test nào.

### Phương án 2: Tách 4 file + barrel index.ts

Giữ file gốc thành `index.ts` chỉ re-export, nội dung test nằm trong `__tests__/` subfolder.

- **Ưu điểm:** Giữ nguyên entry point.
- **Nhược điểm:** Thêm một lớp gián tiếp không cần thiết, Mocha vẫn nhặt file từ subfolder.
- **Rủi ro:** Trung bình — cần cập nhật Mocha config để ignore hoặc include phù hợp.

### Phương án 3: Giữ nguyên, thêm `--grep` để chạy nhóm

Không tách file, chỉ thêm document về cách dùng `--grep`.

- **Ưu điểm:** Không tốn công.
- **Nhược điểm:** Không giải quyết vấn đề conflict và khó đọc.
- **Rủi ro:** Thấp — nhưng không giải quyết triệt để.

## Đánh giá so sánh

| Tiêu chí | PA 1: Tách riêng | PA 2: Barrel index | PA 3: Giữ nguyên |
|----------|-----------------|-------------------|-----------------|
| Độ phức tạp | Thấp | Trung bình | Không |
| Bảo trì | Dễ | Dễ | Trung bình |
| Chạy test riêng lẻ | Dễ | Dễ | Khó |
| Nguy cơ conflict | Thấp | Thấp | Cao |
| Import lặp lại | Có (4 file) | Có (4 file + index) | Không |

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (tách 4 file riêng) vì đơn giản, không cần thay đổi Mocha config, không thêm lớp gián tiếp.
- **Phương án được chọn (sau review):** ... (do người duyệt điền)
- **Lý do:** ...
- **Ràng buộc/Điều kiện:** File gốc `browser-engine.spec.ts` sẽ bị xoá.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|-----------|
| File gốc xoá nhưng còn git history | Thấp | Dùng `git rm`, không xoá thủ công. |
| Quên import `skipTestIfNoKey()` ở file mới | Thấp | Template mỗi file phải có guard này ở đầu describe. |
