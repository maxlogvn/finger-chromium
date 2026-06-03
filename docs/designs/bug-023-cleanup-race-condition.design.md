# Design: Cleanup race condition -- Cleaner chạy trước khi engine process thoát hẳn (Bug fix #23)

## Bối cảnh

`FingerprintPlugin.cleanup()` thực hiện dọn dẹp tài nguyên theo thứ tự: đóng browser, kill engine, release mutex, dừng cleaner. Vấn đề nằm ở chỗ `Connector.cleanup()` và `RemoteEngine.kill()` đều là synchronous (trả về `void`) -- `kill()` chỉ gửi signal SIGTERM đến `FastExecuteScript.exe` rồi trả về ngay, không đợi process con thực sự thoát. `cleaner.stop()` chạy ngay sau đó, quét thư mục và xoá files khi process còn ghi, gây lỗi `EBUSY` trên Windows.

## Câu hỏi làm rõ

- Làm thế nào để đợi process engine thoát hẳn trước khi dọn dẹp? → Dùng `proc.once('exit')` convert thành Promise, await cùng với timeout để tránh treo vô hạn.
- Xử lý thế nào nếu process không chịu thoát? → Dùng SIGKILL fallback (`taskkill /F` trên Windows) sau timeout.
- Có ảnh hưởng gì đến các caller khác không? → `FingerprintPlugin.cleanup()` là async, không có caller nào phụ thuộc vào synchronous behavior. Connector's `cleanup()` chỉ được gọi từ `FingerprintPlugin.cleanup()`.

## Các phương án

### Phương án 1 (khuyến nghị): Async kill với waitForExit đơn giản

Chuyển `kill()` sang async, await process exit với timeout + SIGKILL fallback.

- Ưu điểm: Đơn giản, dễ review. Đủ cho hầu hết trường hợp.
- Nhược điểm: Không phân biệt exit code bất thường.

### Phương án 2: Graceful shutdown + exit code check

Dùng Promise.race giữa `onExit` (kiểm tra exit code) và timeout, reject nếu exit code lạ hoặc timeout.

- Ưu điểm: Phát hiện process crash (exit code != 0).
- Nhược điểm: `FastExecuteScript.exe` thường exit với code non-zero ngay cả khi thành công (do bị kill). Gây false positive.

### Phương án 3: Dùng `child_process.execFile` timeout

Thay vì kill signal, dùng mechanism bên ngoài như `taskkill /F /PID`.

- Ưu điểm: Force kill mạnh mẽ hơn.
- Nhược điểm: Không cho process cơ hội graceful shutdown. Phụ thuộc Windows-specific command.

## Giải pháp được chọn

- Phương án AI đề xuất: **Phương án 1** -- async kill với waitForExit + SIGKILL fallback. Đơn giản, đủ mạnh, không phức tạp hoá.
- Phương án được chọn: Phương án 1.
- Lý do: Issue chủ yếu là race condition (cleaner chạy quá sớm), không phải process treo. SIGKILL fallback chỉ dùng khi process không thoát sau timeout.
- Ràng buộc: `SIGKILL` trên Windows dùng `proc.kill('SIGKILL')` tương đương `taskkill /F`.
