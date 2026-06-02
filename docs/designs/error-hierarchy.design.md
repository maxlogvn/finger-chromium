# Design: Hệ thống lỗi (Error Hierarchy)

## Vấn đề cần giải quyết

Khi thư viện gặp lỗi, người dùng cần biết:
1. **Có lỗi gì xảy ra?** (mô tả lỗi)
2. **Loại lỗi gì?** (timeout, thiếu key, engine lỗi...)
3. **Cách khắc phục?** (hướng dẫn trong message)

Nếu chỉ dùng `throw new Error('something wrong')`, người dùng không thể phân biệt được các loại lỗi để xử lý khác nhau. Ví dụ: lỗi timeout cần retry, lỗi thiếu key cần cấu hình lại, lỗi engine cần tải lại.

## Các phương án đã cân nhắc

### 1. Dùng Error code (số)

```ts
throw { code: 1001, message: 'Timeout' };
```

**Ưu điểm:** Nhẹ, dễ so sánh.

**Nhược điểm:** Không có stack trace, không tận dụng được `instanceof`, khó debug.

### 2. Dùng Error class hierarchy (chọn)

Kế thừa từ `Error`, mỗi loại lỗi là một class riêng.

**Ưu điểm:**
- Dùng được `instanceof` để phân loại.
- Có stack trace đầy đủ.
- Có thể thêm message hướng dẫn khắc phục.
- TypeScript hỗ trợ type narrowing qua `instanceof`.

**Nhược điểm:** Nặng hơn một chút so với Error code, nhưng không đáng kể.

## Giải pháp chọn

### PluginError (base class)

```ts
class PluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Tại sao tự set `this.name`?** Vì JavaScript `Error` class không tự động set `name` khi kế thừa -- nó luôn để là `'Error'`. Set `this.constructor.name` giúp `instance.name` trả về tên class thật.

**Tại sao dùng `Error.captureStackTrace`?** V8 (Node.js) có method này để loại bỏ constructor khỏi stack trace, giúp stack trace sạch hơn. Trên các runtime khác, nó chỉ là no-op.

**Tại sao có `Symbol.toStringTag`?** Khi bạn log `String(error)`, nó hiển thị `PluginError: message` thay vì `Error: message`.

### Các lỗi cụ thể

| Class | Khi nào throw | Message hướng dẫn |
|---|---|---|
| `PluginError` | Lỗi cơ bản, không thuộc loại nào khác | Message gốc |
| `MissingKeyError` | Thiếu key bảo mật | Giải thích cần set key cho cả fetch và apply |
| `InvalidEngineError` | Engine chưa được tải/giải nén đúng | Hướng dẫn xoá engine cũ, tải lại |
| `EngineTimeoutError` | Timeout khi khởi động engine | Hướng dẫn tăng timeout |
| `RequestTimeoutError` | Timeout khi chờ request | Hướng dẫn tăng request timeout |

### Tại sao message lại dài?

Các message lỗi được viết bằng `dedent` template, chứa hướng dẫn khắc phục chi tiết. Lý do:
- Người dùng mới không biết `setEngineTimeout` là gì -- cần hướng dẫn cụ thể.
- Giảm số lần người dùng phải mở docs/tài liệu.
- Lỗi càng rõ ràng, càng ít support request.

---
