# Design: RemoteEngine -- Tải, giải nén và IPC với engine binary

## Bối cảnh

Engine là file nhị phân C/C++ (`FastExecuteScript.exe`) chịu trách nhiệm inject fingerprint. Cần cơ chế tải engine từ bablosoft, verify checksum, giải nén, spawn process, và giao tiếp IPC.

## Câu hỏi làm rõ

- IPC: file-based hay socket? → File-based (dùng chokidar watch), vì engine chỉ hỗ trợ file IPC.
- Có cache metadata không? → Có, lưu version_ARCH.json để tránh fetch mỗi lần.
- Timeout mặc định? → 300s cho cả engine timeout và request timeout (cùng dùng `DEFAULT_TIMEOUT = 300_000`).

## Các phương án

### Phương án 1: Socket/pipe IPC

Nhanh hơn nhưng engine không hỗ trợ — loại.

### Phương án 2: File-based IPC (chọn)

Viết JSON request file, chokidar watch response file.

- Ưu điểm: Engine hỗ trợ sẵn, đơn giản, dễ debug.
- Nhược điểm: Chậm hơn socket, cần dọn file request cũ.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (file-based IPC).
- **Phương án được chọn:** Phương án 2.
- **Lifecycle:**
  1. Constructor: set cwd, args, timeout.
  2. `runFunction()`: updateMeta (nếu chưa) -> startProcess -> tạo request file -> watch response -> parse JSON.
  3. `#updateMeta()`: đọc project.xml -> fetch metadata từ bablosoft -> cache.
  4. `#startProcess()`: verify checksum -> download -> extract -> spawn.
