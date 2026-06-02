# Design: Hệ thống lỗi (Error Hierarchy)

## Bối cảnh

Cần một hệ thống lỗi thống nhất cho toàn bộ engine. Thay vì dùng `Error` thô, mỗi loại lỗi có class riêng để dễ catch và debug.

## Câu hỏi làm rõ

- Có cần nhiều cấp độ lỗi không? → Chỉ cần base class + 4 subclass là đủ.
- Có cần thêm trường `code` (số) không? → Không, dùng `name` (constructor name) là đủ.
- Có cần i18n cho message không? → Không, message tiếng Việt cho developer.

## Các phương án

### Phương án 1: Dùng Error thô với message prefix

- Ưu điểm: Đơn giản, không cần thêm class.
- Nhược điểm: Không thể catch theo type, message prefix dễ sai.

### Phương án 2: Class hierarchy (chọn)

PluginError base + 4 subclass.

- Ưu điểm: Catch đúng type, message chuyên biệt, dễ maintain.
- Nhược điểm: Nhiều class hơn, nhưng đáng giá.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (class hierarchy).
- **Phương án được chọn:** Phương án 2.
- **Lý do:** Dễ catch lỗi, message rõ ràng, dễ mở rộng.
- **Cấu trúc:**
  - `PluginError` — base, extends Error, tự set `name = constructor.name`.
  - `MissingKeyError` — thiếu key bảo mật.
  - `InvalidEngineError` — engine chưa tải/giải nén.
  - `EngineTimeoutError` — timeout khởi động engine.
  - `RequestTimeoutError` — timeout request.

## Chi tiết triển khai

### Tại sao `Error.captureStackTrace`?
Xoá constructor call khỏi stack trace, giúp stack trace ngắn gọn, dễ đọc hơn -- không hiển thị dòng `new PluginError(...)`.

### Tại sao `Symbol.toStringTag`?
Khi dùng `Object.prototype.toString.call(err)`, nếu không có `Symbol.toStringTag`, nó trả về `[object Error]` thay vì `[object MissingKeyError]`. Có tag này giúp debug tools hiển thị đúng tên class.

### Tại sao `dedent`?
Các message lỗi có hướng dẫn khắc phục dài (3-4 dòng). `dedent` giúp viết multi-line template string gọn, không bị thụt lề thừa khi định dạng code.

### Nội dung message
Mỗi subclass tự động thêm hướng dẫn khắc phục vào cuối message:

| Class | Hướng dẫn thêm |
|---|---|
| `MissingKeyError` | Nhắc người dùng set key cả khi nhận fingerprint lẫn khi áp dụng |
| `InvalidEngineError` | 3 bước: xoá engine folder, chạy lại code, mở issue nếu còn lỗi |
| `EngineTimeoutError` | Gợi ý dùng `setEngineTimeout()` để tăng thời gian chờ |
| `RequestTimeoutError` | Gợi ý dùng `setRequestTimeout()` để tăng thời gian chờ |

### Tại sao message lỗi viết tiếng Việt?
Developer target là người Việt, message tiếng Việt giúp đọc nhanh, hiểu ngay hướng dẫn khắc phục mà không cần dịch.
