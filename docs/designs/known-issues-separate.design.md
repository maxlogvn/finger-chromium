# Design: Tách Known Issues ra file riêng

## Bối cảnh

Known Issues hiện đang nằm trong `docs/Welcome.md` -- file dùng để onboarding developer mới. Known Issues cần được cập nhật thường xuyên, nhưng việc sửa Welcome.md mỗi lần thay đổi issue làm loãng nội dung onboarding. Cần tách ra file riêng.

## Câu hỏi làm rõ

- Có cần giữ lại danh sách tóm tắt trong Welcome.md? → Có, giữ link + số lượng issue đang mở.
- Các file khác có tham chiếu đến Known Issues trong Welcome.md không? → ROADMAP.md không, chỉ WORKFLOW.md cần cập nhật cấu trúc thư mục.

## Các phương án

### Phương án 1: Tách hoàn toàn (chọn)

Tạo `docs/KNOWN_ISSUES.md`, chuyển toàn bộ nội dung Known Issues từ Welcome.md sang. Welcome.md chỉ giữ link dẫn.

- Ưu điểm: Phân tách rõ ràng, dễ maintain.
- Nhược điểm: Cần cập nhật WORKFLOW.md để developer biết file mới.

### Phương án 2: Giữ nguyên hiện trạng

Không tách.

- Ưu điểm: Không tốn công.
- Nhược điểm: Welcome.md bị phình, khó maintain.

### Phương án 3: Tách + cập nhật cấu trúc thư mục

Giống phương án 1, thêm KNOWN_ISSUES.md vào cấu trúc thư mục trong Welcome.md và WORKFLOW.md.

- Ưu điểm: Như phương án 1 + đảm bảo developer biết đến file mới.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 3 (tách + cập nhật cấu trúc thư mục).
- **Phương án được chọn:** Phương án 3.
- **Lý do:** Giải quyết triệt để, đảm bảo file mới được biết đến.
