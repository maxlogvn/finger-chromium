# Design: Browser Launcher

## Vấn đề cần giải quyết

Engine binary spawn `worker.exe` để chạy Chromium. Thư viện cần:
1. Spawn Chromium với đúng arguments (debugging port, user data dir, headless mode).
2. Phát hiện DevTools listening URL từ output của Chromium.
3. Cung cấp method `close()` để kill Chromium process an toàn.

## Giải pháp chọn

### Spawn Chromium

Dùng `child_process.spawn` để tạo Chromium process. Các arguments được truyền:
- `--remote-debugging-port=<port>` -- port cho CDP.
- `--user-data-dir=<path>` -- thư mục profile (nếu có).
- Các args khác từ người dùng.

**Tại sao dùng `spawn` thay vì `exec`?** `spawn` cho phép stream stdout/stderr real-time, không cần đợi process kết thúc.

### Phát hiện DevTools URL

Chromium in ra dòng `DevTools listening on ws://127.0.0.1:<port>/...` khi nó đã sẵn sàng. Thư viện dùng `readline` để parse từng dòng trong stderr và stdout.

**Tại sao parse cả stderr và stdout?** Một số phiên bản Chromium in DevTools URL ra stderr, số khác in ra stdout. Đọc cả hai để không bỏ sót.

### Kill process với taskkill

Trên Windows, Chromium có thể spawn child processes riêng (renderer, GPU, ...). `childProcess.kill()` chỉ kill process chính, không kill process tree. Dùng `taskkill /T /F` để kill toàn bộ process tree.

**Tại sao dùng `taskkill`?** `taskkill /T` kill process tree (bao gồm các child processes). `/F` force kill nếu process không đáp ứng. Đây là cách sạch nhất để tắt Chromium trên Windows.

---
