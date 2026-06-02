# Product: File Cleanup Daemon

## Tổng quan

Daemon tự động dọn file rác trong thư mục làm việc của engine. An toàn -- không xoá file đang dùng.

## Cách hoạt động

1. Khi browser launch, `cleaner.ignore()` lock các file của process
2. Khi browser đóng, `cleaner.include()` unlock
3. Timer 15s quét thư mục, xoá file không locked

## File lock mechanism

Dùng `proper-lockfile` để kiểm tra file có đang dùng không. File đang lock bởi process khác → skip.

## An toàn

- Timer `.unref()` -- không giữ process alive
- `ENOENT` bắt silent -- nếu file đã bị xoá trước đó
- File modified trong 15s gần nhất được skip -- tránh xoá file vừa tạo
