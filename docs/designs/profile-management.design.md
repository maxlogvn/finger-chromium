# Design: Quản lý Profile

## Bối cảnh

Khi dùng browser automation, profile chứa cookie, localStorage, session -- dữ liệu cần được giữa nguyên giữa các lần chạy. Tuy nhiên, nếu profile bị browser ghi đè trực tiếp trong quá trình chạy, dữ liệu có thể bị corrupt nếu process bị kill đột ngột.

Cần cơ chế copy profile vào thư mục tạm trước khi dùng, và sao lưu lại sau khi kết thúc. Ngoài ra, khi khởi động lại profile cũ, cần tự động load lại proxy và fingerprint đã dùng lần trước.

## Câu hỏi làm rõ

- Có cần support nhiều profile cùng lúc không? → Mỗi instance BrowserEngine chỉ một profile. Mỗi profile có temp dir riêng.
- Làm sao để load lại proxy/fingerprint từ profile cũ? → Engine tự lưu config vào profile trong lần chạy trước. Plugin gửi `loadProxy`/`loadFingerprint` flag lên engine.
- Profile có được nén không? → Không. Dùng `fs.cpSync` copy nguyên thư mục.

## Các phương án

### Phương án 1: Dùng trực tiếp thư mục profile gốc
Không copy, browser đọc ghi trực tiếp vào profile.

- Ưu điểm: Nhanh, không tốn dung lượng.
- Nhược điểm: Dễ corrupt profile nếu process crash.

### Phương án 2: Copy vào thư mục tạm (chọn)
Copy profile vào temp dir, browser chạy trên bản copy. Khi quit, copy ngược lại.

- Ưu điểm: An toàn, không corrupt profile gốc.
- Nhược điểm: Tốn thời gian copy (nhưng profile thường nhỏ, chỉ vài MB).

### Phương án 3: Symbolic link / hard link
Dùng symlink hoặc hardlink để tránh copy.

- Ưu điểm: Nhanh, không tốn dung lượng.
- Nhược điểm: Windows không phải lúc nào cũng support symlink. Vẫn có nguy cơ corrupt.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2 (copy vào temp dir).
- Phương án được chọn: Phương án 2.
- Lý do: An toàn nhất, tránh corrupt dữ liệu. Profile thường nhỏ nên chi phí copy không đáng kể.
- Ràng buộc: `map()` có thể throw nếu source profile không tồn tại hoặc không có quyền đọc. `unmap()` throw nếu không xoá được temp dir.
