# Design: Bug #14 — RemoteEngine singleton dùng chung giữa các instance

## Bối cảnh

Hiện tại `RemoteEngine` được khởi tạo dưới dạng singleton global ở module-level trong
`src/plugin/connector/index.ts:48-52`. Tất cả `FingerprintPlugin` instance đều dùng chung
một engine process (`FastExecuteScript.exe`). Khi một instance gọi `kill()`, process engine
ngừng hoạt động và ảnh hưởng đến các instance khác. Ngoài ra, `setCwd()` thay đổi thư mục
làm việc cho tất cả instance — gây xung đột cấu hình.

## Câu hỏi làm rõ

- PCAP server có cần mỗi instance một cái riêng không? → Không, PCAP server là TCP server
  mô phỏng PCAP interface, chỉ cần một cái cho cả process. Mỗi engine chỉ cần biết port
  để kết nối.
- `api()` có thể gọi từ nhiều `Connector` cùng lúc không? → Có, vì mỗi `Connector` có
  `AsyncLock` riêng và `RemoteEngine` riêng, không block chéo.
- Có backward compatibility issue không? → Không, API public (`BrowserEngine`,
  `FingerprintPlugin`) không thay đổi. Chỉ thay đổi internal wiring.

## Các phương án

### Phương án 1: Connector class — mỗi FingerprintPlugin có Connector riêng

Tạo class `Connector` trong `src/plugin/connector/index.ts` bao gồm `RemoteEngine`
riêng + `AsyncLock` riêng + `api()` + `cleanup()`. `FingerprintPlugin` tạo
`#connector = new Connector()` ở constructor.

- Ưu điểm: Encapsulation tốt, mỗi instance hoàn toàn độc lập, PCAP server singleton
  trong suốt với Connector, dễ test.
- Nhược điểm: Cần refactor cả `Connector` module và `FingerprintPlugin`.

### Phương án 2: Factory function đơn giản

Xoá singleton engine, thêm `createEngine()` factory. FingerprintPlugin tự quản lý
engine, nhưng `api()` và `cleanup()` vẫn là module-level function cần tham số engine.

- Ưu điểm: Thay đổi ít hơn.
- Nhược điểm: API module-level lộn xộn, dễ gọi sai engine.

### Phương án 3: Sát nhập connector vào FingerprintPlugin

Di chuyển toàn bộ logic connector vào `FingerprintPlugin`.

- Ưu điểm: Không cần module riêng.
- Nhược điểm: Phá vỡ separation of concerns, file quá lớn, khó maintain.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 — Connector class.
- **Phương án được chọn:** Phương án 1.
- **Lý do:** Encapsulation tốt nhất, mỗi instance độc lập, không ảnh hưởng lẫn nhau,
  dễ test, backward compatible.
- **Ràng buộc:** PCAP server giữ nguyên là module-level singleton dùng chung.
  `Connector.cleanup()` không đóng PCAP server để tránh ảnh hưởng instance khác.
