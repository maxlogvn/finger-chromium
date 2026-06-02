# Design: Debug Logging

## Bối cảnh

Dự án có nhiều layer (connector IPC, engine lifecycle, PCAP server, file cleanup). Khi debug, cần logging theo module để dễ theo dõi, nhưng không muốn log ảnh hưởng production.

Cần một giải pháp logging dễ bật/tắt, structured, không overhead khi không dùng.

## Câu hỏi làm rõ

- Log ra stdout hay stderr? → stderr (`debug` package default).
- Có cần log level (info/warn/error) không? → Không, `debug` dùng namespace pattern.
- Có cần tích hợp với file logging? → Chưa, chỉ console trong giai đoạn hiện tại.

## Các phương án

### Phương án 1: console.log + flag

Kiểm tra biến môi trường DEBUG thủ công, dùng `console.log` / `console.error`.

- Ưu điểm: Không phụ thuộc thư viện.
- Nhược điểm: Không có namespace, không wildcard, không format chuẩn.

### Phương án 2: winston / pino

Dùng thư viện logging mạnh mẽ.

- Ưu điểm: Log levels, transports, format tùy biến.
- Nhược điểm: Nặng, quá mức cần thiết cho debug logging.

### Phương án 3: `debug` package (chọn)

Thư viện nhẹ chuyên cho debug logging, namespace + wildcard + zero overhead khi tắt.

- Ưu điểm: Zero dependency, namespace có wildcard, tự động format timestamp + màu, no-op khi tắt.
- Nhược điểm: Chỉ log ra stderr, không có file transport.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 3 (`debug` package).
- **Phương án được chọn:** Phương án 3.
- **Lý do:** Nhẹ, đúng mục đích debug logging, zero overhead khi tắt.
- **Ràng buộc:** Namespace convention `browser-with-fingerprints:<module>` để dễ filter.
