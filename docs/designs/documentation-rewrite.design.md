# Design: Viết lại toàn bộ tài liệu theo template chuẩn

## Bối cảnh

Hiện tại dự án có 5 template tài liệu trong `docs/templates/` (design, spec, plan, product, overview). Tuy nhiên các tài liệu thực tế trong `docs/designs/`, `docs/specs/`, `docs/plans/`, `docs/products/`, `docs/overviews/` không tuân theo cấu trúc section của template. Cụ thể:

- **design:** thiếu section "Câu hỏi làm rõ".
- **spec:** thiếu section "Yêu cầu" và "Thiết kế".
- **overview:** thiếu section "Tài liệu liên quan", kết quả trình bày dạng list thay vì bảng.

Ngoài ra, một số tài liệu không cập nhật theo code thật (ví dụ danh sách export, API, xử lý lỗi).

Cần rewrite toàn bộ ~105 file tài liệu để đồng bộ với template và code thật.

## Câu hỏi làm rõ

- Có cần giữ lại nội dung cũ hay viết hoàn toàn mới từ code? → Viết mới từ code, đọc code thật trước khi viết.
- Có cần lint/build cho file .md không? → Không, chỉ cần kiểm tra thủ công nội dung.
- Thứ tự xử lý? → Theo thứ tự roadmap từ trên xuống dưới.

## Các phương án

### Phương án 1: Giữ nguyên nội dung, sửa cấu trúc section
Chỉ thêm/xoá/sắp xếp sections để khớp template, không đọc lại code.

- Ưu điểm: Nhanh.
- Nhược điểm: Thông tin có thể sai lệch so với code thật.

### Phương án 2: Đọc code rồi viết lại hoàn toàn (chọn)
Với mỗi feature, đọc code thật -> viết 5 file tài liệu theo template.

- Ưu điểm: 100% khớp code và template, nhất quán giữa các feature.
- Nhược điểm: Tốn thời gian hơn, nhưng chất lượng cao nhất.

### Phương án 3: Kết hợp
Giữ nguyên design/overview, chỉ viết lại spec/product/plan.

- Ưu điểm: Tiết kiệm hơn phương án 2.
- Nhược điểm: Không đồng bộ giữa 5 loại tài liệu.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (đọc code -> viết lại hoàn toàn).
- **Phương án được chọn:** Phương án 2.
- **Lý do:** Đảm bảo chất lượng và tính nhất quán cao nhất.
- **Ràng buộc:** Không cần chạy lint/build cho file .md.

## Luồng hoạt động

Với mỗi feature (xử lý tuần tự theo roadmap):

1. Đọc toàn bộ source code của feature.
2. Viết `design.md` theo `design.template.md`.
3. Viết `spec.md` theo `spec.template.md`.
4. Viết `plan.md` theo `plan.template.md`.
5. Viết `product.md` theo `product.template.md`.
6. Viết `overview.md` theo `overview.template.md`.
7. Kiểm tra nội dung (thủ công) và chuyển sang feature tiếp theo.
