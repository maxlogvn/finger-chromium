# Design: Fix quit() không dọn dẹp hết handles

## Bối cảnh

Khi gọi `Chromium.quit()`, method chỉ close `BrowserContext` và unmap thư mục profile tạm. Bỏ sót toàn bộ tài nguyên nền: worker.exe, engine process, PCAP server, chokidar watcher, cleaner timer, Windows named mutex.

Hậu quả: Node.js process không thoát tự nhiên vì event loop còn bận.

## Câu hỏi làm rõ

- Có cần kill process tree hay chỉ kill process chính? → `taskkill /T /F` (tree).
- Thứ tự cleanup quan trọng? → Có: kill browser trước, engine sau, cleaner cuối.
- Double-close browser có sao không? → Có, cần try/catch swallow.

## Các phương án

### Phương án A: Lưu reference + dọn dẹp tập trung (chọn)

Lưu `Browser` object và engine process reference trong FingerprintPlugin, mở rộng `quit()` dọn dẹp tuần tự.

- Ưu điểm: Tập trung, dễ debug.
- Nhược điểm: Cần sửa nhiều file.

### Phương án B: Cleanup handler chain

Mỗi module đăng ký handler, `quit()` gọi tất cả.

- Ưu điểm: Module độc lập.
- Nhược điểm: Phức tạp hoá lifecycle, khó đảm bảo thứ tự.

## Giải pháp được chọn

- **Phương án được chọn:** Phương án A.
- **Lý do:** Dễ hiểu, maintain, tránh side effect.
- **Ràng buộc:** Thứ tự cleanup: browser -> engine -> pcap -> mutex -> cleaner.
