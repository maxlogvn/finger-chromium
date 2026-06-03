# Design: Dọn dẹp file engine corrupt khi download thất bại

## Bối cảnh

Hàm `download()` trong `src/plugin/connector/engine.ts:129-145` mở file output ngay tại dòng 131 (`createWriteStream(filePath)`) trước khi gửi bất kỳ request HTTP nào. Nếu quá trình download thất bại ở bất kỳ bước nào (network error, 4xx/5xx, timeout, connection reset, disk full), **không có cơ chế dọn dẹp** file partial/empty trên disk.

Hậu quả: thư mục `data/engine/<version>/` tích luỹ file `.zip` corrupt qua nhiều lần chạy. Khi lần chạy sau phát hiện checksum sai, code xoá toàn bộ engineDir và tải lại — tốn băng thông, thời gian, gây confusion cho dev.

## Câu hỏi làm rõ

- Câu hỏi 1: Có trường hợp nào cần giữ lại file partial không? → Trả lời: Không. File partial không có giá trị gì.
- Câu hỏi 2: `fs.rename()` có an toàn trên Windows khi source và destination khác drive không? → Trả lời: `fs.rename()` fail với cross-device link error. Khi đó cần fallback sang `fs.copyFile()` + `fs.unlink()`.

## Các phương án

### Phương án 1: Temp file + rename (khuyến nghị)

Viết vào file `.tmp` trước, chỉ `rename()` thành file đích sau khi pipeline thành công.

- Ưu điểm: An toàn nhất — không có cửa sổ nào file đích ở trạng thái corrupt. Nếu process bị kill giữa chừng, chỉ mất file `.tmp`, file gốc không bị ảnh hưởng.
- Nhược điểm: Cần xử lý cross-device rename fallback. Tốn thêm một operation `rename()`.

### Phương án 2: `finally` cleanup

Giữ nguyên `createWriteStream(filePath)`, thêm boolean `success` + `finally` block xoá file nếu `!success`.

- Ưu điểm: Đơn giản, ít thay đổi code.
- Nhược điểm: Nếu process bị kill giữa pipeline, file đích vẫn bị corrupt (không có `finally` khi process chết đột ngột).

## Giải pháp được chọn

- Phương án AI đề xuất: **Phương án 1 (Temp file + rename)** vì an toàn nhất, loại trừ hoàn toàn khả năng file corrupt kể cả khi process bị kill giữa chừng.
- Phương án được chọn: _(do người duyệt điền)_
- Lý do: _(do người duyệt điền)_
- Ràng buộc: Cần dùng `fs.promises.rename()` với fallback `copyFile` + `unlink` khi cross-device.
