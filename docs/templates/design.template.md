# Design: <tên tính năng>

> **Version:** 1.0 | **Cập nhật lần cuối:** YYYY-MM-DD  
> **Người viết:** ... | **Người phản biện:** ...

## Bối cảnh
Mô tả ngắn gọn vấn đề cần giải quyết và lý do tính năng này cần thiết.  
Ví dụ: "Hiện tại fingerprint chỉ được inject ở JS layer, dễ bị phát hiện bởi bot detection. Cần inject ở tầng C/C++ native."

## Câu hỏi làm rõ
Liệt kê các câu hỏi cần trả lời trước khi thiết kế. Điền câu trả lời sau khi có thông tin.

1. **Câu hỏi:** Engine có hỗ trợ hook `webgl.getParameter` không?  
   → **Trả lời:** Có, từ phiên bản 2.1.0.
2. **Câu hỏi:** Noise có cần đồng bộ giữa các lần gọi không?  
   → **Trả lời:** Không, mỗi lần launch là một seed mới.
3. **Câu hỏi:** ... (thêm nếu cần)

## Các phương án

### Phương án 1: Inject qua JS CDP
Mô tả ngắn.

- **Ưu điểm:** Dễ implement, không cần sửa engine.
- **Nhược điểm:** Dễ bị phát hiện hơn.
- **Rủi ro:** Bot detection có thể check native binding.

### Phương án 2: Inject native qua engine
Mô tả ngắn.

- **Ưu điểm:** Khó bị phát hiện, hiệu suất tốt hơn.
- **Nhược điểm:** Cần nâng cấp engine, phụ thuộc vào phiên bản.
- **Rủi ro:** Engine chưa support trên Linux.

### Phương án 3: ... (nếu có)

## Đánh giá so sánh

| Tiêu chí | Phương án 1 | Phương án 2 |
|----------|-------------|-------------|
| Độ phức tạp | Thấp | Trung bình |
| Bảo trì | Dễ | Trung bình |
| Khả năng bị phát hiện | Cao | Thấp |
| Hiệu năng | Tốt | Tốt nhất |
| Tương thích (OS) | Windows/Mac/Linux | Chỉ Windows 64-bit hiện tại |

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (native injection) vì độ khó phát hiện thấp, phù hợp với mục tiêu chính.
- **Phương án được chọn (sau review):** ... (do người duyệt điền)
- **Lý do:** ...
- **Ràng buộc/Điều kiện:** Chỉ hỗ trợ Windows 64-bit, cần engine >= 2.1.0.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|------------|
| Engine chưa support Linux | Trung bình | Fallback sang JS injection nếu phát hiện OS không hỗ trợ. |
| Thay đổi API engine giữa các phiên bản | Thấp | Version check và adapter pattern. |
