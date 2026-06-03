# Design: API Connector -- Giao tiếp với engine

## Bối cảnh

Cần một lớp giao tiếp chuẩn giữa FingerprintPlugin và RemoteEngine. API Connector là class wrapper với async-lock để đồng bộ request, PCAP server lazy init, và chuẩn hóa lỗi. Mỗi `FingerprintPlugin` instance sở hữu `Connector` riêng.

## Câu hỏi làm rõ

- Singleton hay instance? → Instance-based. Mỗi `FingerprintPlugin` tạo `Connector` riêng với `RemoteEngine` riêng và `AsyncLock` riêng. PCAP server là singleton dùng chung cho cả process, lazy init ở lần gọi API đầu tiên.
- Có cần lock không? → Có, dùng async-lock để tránh request chồng chéo trên cùng một engine process.
- PCAP server auto-start? → Không. Lazy init: chỉ listen khi `api()` được gọi lần đầu.

## Các phương án

### Phương án 1: Mỗi request tạo engine instance mới

- Ưu điểm: Cô lập request.
- Nhược điểm: Tốn tài nguyên, không tận dụng được process có sẵn.

### Phương án 2: Singleton + lock (chọn)

- Ưu điểm: Tái sử dụng engine process, lock đồng bộ, dễ quản lý.
- Nhược điểm: Request phải chờ nhau.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (singleton + async-lock) — đã được thay đổi sau các bug fix.
- **Phương án được chọn (hiện tại):** Instance-based class `Connector` — mỗi `FingerprintPlugin` tạo `Connector` riêng với `RemoteEngine` riêng và `AsyncLock` riêng.
- **Lý do thay đổi:** Singleton `RemoteEngine` gây xung đột khi nhiều instance dùng chung một engine process (Bug #14). Cleaner singleton cũng gây race condition (Bug #13). Chuyển sang instance-based giúp cô lập tài nguyên giữa các `BrowserEngine` instance.
- **API:** `api(name, params)` -> lock.acquire -> engine.runFunction -> normalize error.
- **Cleanup:** `cleanup()` kill engine + close PCAP server (nếu đã init).
