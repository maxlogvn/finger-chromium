# Design: Common Scripts

## Bối cảnh

Khi fingerprint được inject qua engine C/C++, viewport bị lock ở kích thước nhất định. Sau khi resize viewport (qua CDP), cần đợi browser layout và paint hoàn tất trước khi đo kích thước thực tế. Ngoài ra, cần một cách để lấy kích thước viewport hiện tại từ trong browser context (dùng cho CDP-based resize + verify).

Các script này chạy trong browser context qua `page.evaluate()` hoặc CDP `Runtime.evaluate`.

## Câu hỏi làm rõ

- Có thể dùng `setTimeout` thay `requestAnimationFrame` không? → Không, rAF đảm bảo chạy sau khi layout/paint hoàn tất, setTimeout không có cam kết này.
- Tại sao dùng `innerWidth` thay `clientWidth`? → Fingerprint service dùng `innerWidth` (bao gồm scrollbar), cần đồng bộ để tránh sai lệch.

## Các phương án

### Phương án 1: Một function duy nhất

Gộp cả waitForResize và getViewport vào một function, trả về kích thước sau khi resize.

- Ưu điểm: Một lần evaluate là xong.
- Nhược điểm: Không tái dùng được: có lúc chỉ cần wait (ví dụ CDP setViewport), có lúc chỉ cần get.

### Phương án 2: Object scripts với 2 function riêng (chọn)

Tách `waitForResize` và `getViewport` thành 2 function riêng trong object `scripts`.

- Ưu điểm: Linh hoạt, mỗi script dùng độc lập. Dễ maintain.
- Nhược điểm: Phải evaluate 2 lần nếu cần cả wait + get.

### Phương án 3: Dùng CDP events thay vì in-browser script

Dùng CDP `Page.layoutMetrics` hoặc `Runtime.evaluate` với expression inline.

- Ưu điểm: Không cần script riêng.
- Nhược điểm: Không có cơ chế "đợi resize hoàn tất" chuẩn như ResizeObserver.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (object `scripts` với 2 function riêng).
- **Phương án được chọn:** Phương án 2.
- **Lý do:** Linh hoạt, dễ maintain, mỗi script dùng được độc lập.
- **Ràng buộc:** Scripts không dùng closure variables -- mọi thứ trong function body.
