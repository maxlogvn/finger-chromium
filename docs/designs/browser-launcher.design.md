# Design: Browser Launcher -- Spawn Chromium mặc định

## Bối cảnh

Cần một module spawn Chromium, phát hiện DevTools listening URL từ stderr/stdout, và trả về Browser object với close/configure methods.

## Câu hỏi làm rõ

- Dùng spawn hay exec? → spawn (stream output, không buffer).
- Kill process tree? → Dùng `taskkill /T /F` trên Windows (kill cả child processes).
- Timeout mặc định? → 30s.

## Các phương án

### Phương án 1: Dùng Playwright launch trực tiếp

Đơn giản nhưng không linh hoạt cho fingerprint injection.

### Phương án 2: Spawn thủ công (chọn)

Spawn worker.exe -> parse DevTools URL từ stdout/stderr -> trả về Browser.

- Ưu điểm: Kiểm soát hoàn toàn process, không qua Playwright layer.
- Nhược điểm: Phải tự parse URL.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (spawn thủ công).
- **Phương án được chọn:** Phương án 2.
- **Cơ chế:** spawn -> createInterface trên stdout/stderr -> regex `DevTools listening on (.*)` -> parse port -> return Browser.
