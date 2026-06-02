# Design: PCAP Server -- Mock TCP server

## Bối cảnh

Engine yêu cầu một PCAP interface để giao tiếp. Thay vì dùng PCAP thật (phức tạp, cần driver), ta tạo một TCP server đơn giản mô phỏng giao thức PCAP.

## Câu hỏi làm rõ

- Cần implement đầy đủ giao thức PCAP không? → Không, chỉ cần 2 lệnh engine dùng: 0x01 (request ID) và 0x07 (heartbeat).
- Retry port khi EADDRINUSE? → Có, retry sau 1s.

## Các phương án

### Phương án 1: Dùng thư viện PCAP thật

Phức tạp, cần driver, không portable.

### Phương án 2: Mock TCP server (chọn)

net.createServer đơn giản, phản hồi 2 lệnh binary.

- Ưu điểm: Nhẹ, đơn giản, chỉ 71 dòng.
- Nhược điểm: Không phải PCAP thật, nhưng engine không cần.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (mock TCP).
- **Phương án được chọn:** Phương án 2.
- **Cơ chế:** `once()` đảm bảo chỉ một server. Retry port 1s khi EADDRINUSE. `close()` giải phóng port.
