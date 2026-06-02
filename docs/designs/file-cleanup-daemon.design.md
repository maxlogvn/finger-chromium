# Design: File Cleanup Daemon

## Bối cảnh

Engine tạo ra nhiều file tạm trong quá trình chạy (`.ini` config, `t/` process files). Nếu không dọn dẹp, thư mục sẽ chứa đầy file rác từ các session cũ. Tuy nhiên, nếu xoá file khi process còn đang chạy, engine và worker.exe sẽ crash.

Cần cơ chế tự động dọn dẹp file tạm nhưng an toàn: chỉ xoá file đã hết hạn (không còn process sở hữu) và đảm bảo không xoá file đang dùng.

## Câu hỏi làm rõ

- Làm sao biết file đang được dùng? → Dùng `proper-lockfile`. Khi process bắt đầu, lock file (`ignore()`). Khi process kết thúc, unlock (`include()`).
- Bao lâu quét một lần? → 15 giây (`CLEANUP_INTERVAL`).
- File nào bị lock? → `t/{pid}`, `s/{id}.ini`, `s/{id}1.ini`.

## Các phương án

### Phương án 1: Xoá toàn bộ khi process kết thúc (cleanup trong quit)
Khi gọi `cleanup()`, xoá tất cả file trong thư mục engine.

- Ưu điểm: Đơn giản, dễ implement.
- Nhược điểm: Nếu process crash trước khi gọi `cleanup()`, file rác tồn đọng.

### Phương án 2: Daemon chạy nền, quét định kỳ (chọn)
Dùng `setInterval` với timer 15s, quét file, kiểm tra lock, xoá file không còn lock.

- Ưu điểm: Dọn dẹp ngay cả khi process crash trước cleanup. An toàn nhờ lock.
- Nhược điểm: Tốn CPU (quét mỗi 15s), nhưng không đáng kể.

### Phương án 3: Dùng file system watcher
Dùng `chokidar` để watch thay đổi, trigger cleanup khi cần.

- Ưu điểm: Chủ động hơn, không tốn CPU định kỳ.
- Nhược điểm: Phức tạp, dễ miss event nếu watcher bị overload.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2 (daemon timer + lock check).
- Phương án được chọn: Phương án 2.
- Lý do: Đơn giản, an toàn, dễ maintain. Timer 15s đủ nhanh để dọn dẹp kịp thời.
- Ràng buộc: Yêu cầu `proper-lockfile` lock file ở hệ thống. Timer dùng `.unref()` để không block process exit.
