# Design: Tách Known Issues ra file riêng

## Bối cảnh
Hiện tại Known Issues đang nằm trong `docs/Welcome.md` -- file dùng để onboarding developer mới. Known Issues cần được cập nhật thường xuyên (thêm issue mới, chuyển OPEN -> FIXED), nhưng việc sửa Welcome.md mỗi lần thay đổi issue làm loãng nội dung onboarding. Cần tách ra file riêng.

## Câu hỏi làm rõ
- Có cần giữ lại danh sách tóm tắt trong Welcome.md không? → Có, giữ link + số lượng issue đang mở để developer biết có issue cần lưu ý.
- Các file khác có tham chiếu đến Known Issues trong Welcome.md không? → ROADMAP.md không tham chiếu, các file overview cũng không. Chỉ có WORKFLOW.md cần cập nhật cấu trúc thư mục.

## Các phương án

### Phương án 1: Tách hoàn toàn
Tạo `docs/KNOWN_ISSUES.md`, chuyển toàn bộ nội dung Known Issues từ Welcome.md sang. Welcome.md chỉ giữ link dẫn.

- Ưu điểm: Phân tách rõ ràng trách nhiệm, dễ maintain.
- Nhược điểm: Không ai biết đến file mới nếu không được nhắc.

### Phương án 2: Giữ nguyên hiện trạng
Không tách, tiếp tục gộp Known Issues trong Welcome.md.

- Ưu điểm: Không tốn công sửa.
- Nhược điểm: Welcome.md bị phình ra, maintain khó, nội dung onboarding bị loãng.

### Phương án 3: Tách + thêm vào cấu trúc thư mục docs
Giống phương án 1, nhưng cập nhật cả Welcome.md, WORKFLOW.md để liệt kê KNOWN_ISSUES.md trong cấu trúc thư mục.

- Ưu điểm: Như phương án 1 + đảm bảo developer mới biết đến file.
- Nhược điểm: Cần sửa 2 file doc khác.

## Giải pháp được chọn
AI ghi đề xuất phương án ưu tiên ở đây; người duyệt quyết định và điều chỉnh.

- Phương án AI đề xuất: **Phương án 3** (tách hoàn toàn + cập nhật cấu trúc thư mục).
- Lý do: Giải quyết triệt để vấn đề maintain, không làm loãng onboarding, và đảm bảo file mới được biết đến.
- Phương án được chọn: ... (do người điền sau khi review)
- Ràng buộc hoặc điều kiện kèm theo (nếu có): ...
