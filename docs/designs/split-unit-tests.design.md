# Design: Chia tách Unit Tests Core thành nhiều file

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06
> **Người viết:** AI Agent | **Người phản biện:** (chờ duyệt)

## Bối cảnh

File `tests/unit/core.spec.ts` hiện tại dài 323 dòng chứa 31 tests thuộc 3 module khác nhau:
Error classes, Public exports, và Config. File quá dài gây khó khăn trong bảo trì,
review song song, và dễ conflict khi merge. Cần chia tách thành các file riêng theo module.

## Câu hỏi làm rõ

1. **Câu hỏi:** Section "Public exports" có 5/6 tests trùng lặp với section "Error classes" — có nên giữ không?
   → **Trả lời:** Giữ nguyên 6 tests trong file `exports.spec.ts` riêng để đảm bảo an toàn
   nếu `errors.spec.ts` bị xoá hoặc thay đổi.

2. **Câu hỏi:** Có cần thêm `.mocharc.yml` pattern mới không?
   → **Trả lời:** Không, pattern `tests/**/*.ts` đã bao gồm tất cả file trong `tests/unit/`.

3. **Câu hỏi:** Có cần tạo file `index.ts` trong `tests/unit/` để re-export không?
   → **Trả lời:** Không cần, Mocha tự động tìm và chạy tất cả file `*.spec.ts`.

## Các phương án

### Phương án 1: Giữ nguyên một file (không làm gì)

Giữ nguyên `core.spec.ts` với 323 dòng.

- **Ưu điểm:** Không mất công sửa, không thay đổi gì.
- **Nhược điểm:** File vẫn dài, khó maintain, dễ conflict.

### Phương án 2: Tách theo module — 3 file riêng biệt

Tách thành `errors.spec.ts`, `exports.spec.ts`, `config.spec.ts`.

- **Ưu điểm:** Mỗi file chỉ chứa tests của một module, dễ maintain, review nhanh, giảm conflict.
- **Nhược điểm:** Phải sửa imports cho từng file, cần kiểm tra không thiếu test nào.
- **Rủi ro:** Import thiếu hoặc sai path, test không chạy được.

### Phương án 3: Tách theo module + test helper chung

Như phương án 2 nhưng tạo thêm `tests/unit/setup.ts` chứa mock objects dùng chung
(hiện tại mock được define inline trong từng test).

- **Ưu điểm:** Giảm trùng lặp mock code, dễ maintain hơn.
- **Nhược điểm:** Overengineering — mock hiện tại chỉ dùng trong config tests,
  phạm vi nhỏ, chưa cần thiết phải tách riêng.

## Đánh giá so sánh

| Tiêu chí | Phương án 1 | Phương án 2 | Phương án 3 |
|---|---|---|---|
| Độ phức tạp | Không | Thấp | Trung bình |
| Bảo trì | Khó | Dễ | Dễ nhất |
| Giảm conflict | Không | Có | Có |
| DRY | Không | Không | Có |
| Rủi ro | Không | Thấp | Trung bình |

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 — tách 3 file riêng biệt.
- **Phương án được chọn (sau review):** ...
- **Lý do:** Đơn giản, ít rủi ro, giải quyết đúng vấn đề mà không overengineering.
- **Ràng buộc:** Pattern Mocha `tests/**/*.ts` vẫn hoạt động, không cần thay đổi cấu hình.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|-----------|
| Import sai path trong file mới | Thấp | Dùng TypeScript type check (`npm run typecheck`) |
| Thiếu test case khi copy | Thấp | So sánh tổng số test trước và sau khi tách |
| Test vẫn chạy nhưng sai logic | Thấp | Chạy `npm test` và verify kết quả |
