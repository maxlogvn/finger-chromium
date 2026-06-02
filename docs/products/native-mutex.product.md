# Product: Native Mutex

## Tổng quan

Windows named mutex đảm bảo chỉ một instance browser dùng một profile tại một thời điểm. Cross-process safety.

## Cách hoạt động

Khi `_launch()` được gọi, mutex `BASProcess${pid}` được tạo. Nếu một process khác cố gắng launch với cùng profile, mutex sẽ block.

Mutex tự động release khi process kết thúc (Windows kernel quản lý).

## Tại sao không dùng async-lock?

`async-lock` đồng bộ trong cùng process. Native mutex hoạt động cross-process -- cần thiết vì engine binary chạy trong child process riêng.
