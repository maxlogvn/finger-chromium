# Design: API Connector -- Giao tiếp với engine

## Bối cảnh

Cần một lớp giao tiếp chuẩn giữa FingerprintPlugin và RemoteEngine. API Connector là singleton wrapper với async-lock để đồng bộ request, tự động khởi động PCAP server, và chuẩn hóa lỗi.

## Câu hỏi làm rõ

- Singleton hay instance? → Singleton, vì chỉ có một engine duy nhất.
- Có cần lock không? → Có, dùng async-lock để tránh request chồng chéo.
- PCAP server auto-start? → Có, listen ngay khi connector khởi tạo.

## Các phương án

### Phương án 1: Mỗi request tạo engine instance mới

- Ưu điểm: Cô lập request.
- Nhược điểm: Tốn tài nguyên, không tận dụng được process có sẵn.

### Phương án 2: Singleton + lock (chọn)

- Ưu điểm: Tái sử dụng engine process, lock đồng bộ, dễ quản lý.
- Nhược điểm: Request phải chờ nhau.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (singleton + async-lock).
- **Phương án được chọn:** Phương án 2.
- **API:** `api(name, params)` -> lock.acquire -> engine.runFunction -> normalize error.
- **Cleanup:** `cleanup()` kill engine + close PCAP server.
