# Design: Bug #8 — Engine download URL dùng HTTP không an toàn

## Bối cảnh

Hiện tại engine download URL dùng `http://` thay vì `https://` ở hai chỗ:
1. URL fetch metadata từ bablosoft (hardcoded trong `engine.ts:389`)
2. URL download engine binary (lấy từ `data.Url` trong phản hồi metadata)

Dùng HTTP dễ bị MITM tấn công — kẻ tấn công có thể chèn file độc hại vào metadata hoặc binary engine khi đang tải về.

## Câu hỏi làm rõ

- Có cần fallback về HTTP không? → Có, để tránh blocking nếu bablosoft chưa hỗ trợ HTTPS đầy đủ.
- Phạm vi ảnh hưởng? → Chỉ `src/plugin/connector/engine.ts`.

## Các phương án

### Phương án 1: Đơn giản — đổi scheme, không fallback

Đổi `http://` thành `https://` ở cả 2 chỗ. Nếu HTTPS fail, throw error luôn.

- Ưu điểm: Code đơn giản, không thêm logic.
- Nhược điểm: Nếu bablosoft chưa support HTTPS, user không tải được engine.

### Phương án 2: Có fallback — thử HTTPS trước, nếu fail thì thử HTTP

Wrapper hàm request với cơ chế fallback: thử HTTPS, nếu fail (network error) thì thử lại với HTTP. Chỉ throw error khi cả hai đều fail.

- Ưu điểm: An toàn, không blocking user dù bablosoft có hỗ trợ HTTPS hay không.
- Nhược điểm: Thêm một chút logic wrapper.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2 — có fallback.
- Phương án được chọn: Phương án 2.
- Lý do: Đảm bảo an toàn (HTTPS ưu tiên) nhưng vẫn hoạt động nếu bablosoft chưa hỗ trợ HTTPS đầy đủ — không làm blocking user.
- Ràng buộc: Chỉ fallback khi lỗi network/HTTP (không fallback cho lỗi 404 hay 500).
