# Design: Format và Comment lại toàn bộ Codebase

## Bối cảnh

Toàn bộ codebase (25 file TypeScript) không tuân thủ quy tắc comment/format trong `docs/CONVENTIONS.md`:
- 0/25 file có header comment mô tả luồng hoạt động.
- 2/25 file có section divider.
- 56% comment chỉ mô tả WHAT, không giải thích WHY.
- Thiếu JSDoc trên nhiều export public.

## Câu hỏi làm rõ

- Có sửa logic code không? → Không, chỉ thay đổi comment và format.
- Có cần tạo component mới? → Không.
- Phạm vi: toàn bộ `src/` (25 file) hay chỉ một phần? → Toàn bộ `src/`.

## Các phương án

### Phương án A: Làm thủ công từng file (chọn)

Đọc từng file, phân tích luồng chính, viết header/divider/JSDoc/step comments phù hợp.

- Ưu điểm: Chất lượng cao, comment sát code thật.
- Nhược điểm: Tốn thời gian, cần hiểu rõ code.

### Phương án B: Tự động hoá một phần

Script tự động thêm divider/header template, sau đó sửa tay nội dung.

- Ưu điểm: Nhanh hơn.
- Nhược điểm: Vẫn cần sửa tay nhiều, nguy cơ sai format.

## Giải pháp được chọn

- **Phương án được chọn:** Phương án A (làm thủ công từng file).
- **Lý do:** Đảm bảo comment sát với code thật, chất lượng cao nhất.
- **Ràng buộc:** Không sửa logic code, chỉ comment.
