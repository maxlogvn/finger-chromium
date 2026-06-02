# Design: Fingerprint Config -- Gắn fingerprint vào browser

## Bối cảnh

Fingerprint data cần được inject vào browser ở tầng native C/C++ trước khi Chromium khởi động. User cần API để truyền fingerprint data + options (PerfectCanvas, WebGL noise, Audio noise...).

## Câu hỏi làm rõ

- Options mặc định bật/tắt? → Đa số bật (true) -- chỉ safeElementSize mặc định false.
- Fingerprint data format? → JSON string từ service, có thể chứa PerfectCanvas data.
- Inject ở đâu? → Qua engine `Setup` API (connector) trước khi spawn worker.

## Các phương án

### Phương án 1: Chỉ truyền data string, không options

Đơn giản nhưng không linh hoạt — user không kiểm soát được noise techniques.

### Phương án 2: Data + options object (chọn)

```ts
useFingerprint(data: string, options?: FingerprintOptions)
```
Options kiểm soát từng technique riêng biệt.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2.
- **Phương án được chọn:** Phương án 2.
- **Lý do:** Cần options để user kiểm soát từng kỹ thuật noise riêng lẻ (PerfectCanvas, WebGL, Audio...) thay vì bật/tắt toàn bộ.
- **Cơ chế:** Fingerprint data + options → validate → lưu config → gửi qua API `setup` khi launch.
