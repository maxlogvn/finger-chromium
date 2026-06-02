# Design: Quản lý Viewport

## Bối cảnh

Khi browser automation với fingerprint, viewport cần được đặt đúng kích thước fingerprint thật. Nếu viewport sai lệch so với fingerprint (ví dụ fingerprint ghi nhận 1920x1080 nhưng viewport lại là 800x600), bot detection dễ dàng phát hiện.

Tuy nhiên, resize viewport qua CDP không phải lúc nào cũng chính xác ngay lần đầu -- có sai lệch do khung viền trình duyệt, thanh công cụ, DPI scaling. Cần cơ chế retry với delta correction.

## Câu hỏi làm rõ

- Ai chịu trách nhiệm resize viewport? → Plugin có hai implementation: `src/plugin/browser.ts` (dùng chrome-remote-interface) và `src/adapter/playwright/utils.ts` (dùng Playwright CDPSession).
- Viewport có bị thay đổi sau khi set không? → Có thể, nếu người dùng gọi `setViewportSize` hoặc resize tay. Cần proxy `setViewportSize` để chặn.
- Delta correction hoạt động thế nào? → Ban đầu trừ 16x88 (khung viền). Nếu sai lệch, tự động cộng dồn sai số vào delta cho lần thử sau.

## Các phương án

### Phương án 1: Chỉ set viewport một lần, không retry
Đặt kích thước window bounds CDP, không kiểm tra lại.

- Ưu điểm: Nhanh, đơn giản.
- Nhược điểm: Thường bị sai lệch do DPI scaling và khung viền.

### Phương án 2: Set viewport với retry + delta correction (chọn)
Set viewport, kiểm tra lại. Nếu sai, tự điều chỉnh delta và thử lại (tối đa 3 lần).

- Ưu điểm: Chính xác đến từng pixel sau tối đa 3 lần thử.
- Nhược điểm: Tốn thời gian hơn (tối đa 3 lần CDP call). Chấp nhận được vì chỉ gọi một lần khi khởi tạo.

### Phương án 3: Không set viewport, dùng mặc định
Bỏ qua viewport, để browser tự chọn kích thước.

- Ưu điểm: Không tốn thời gian.
- Nhược điểm: Dễ bị phát hiện vì viewport không khớp fingerprint.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2 (retry + delta correction).
- Phương án được chọn: Phương án 2.
- Lý do: Đảm bảo viewport khớp chính xác với fingerprint, giảm nguy cơ bị phát hiện.
- Ràng buộc: Yêu cầu CDP kết nối đến browser. Không ảnh hưởng đến performance đáng kể.
