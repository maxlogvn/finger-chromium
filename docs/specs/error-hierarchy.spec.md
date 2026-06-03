# Spec: Hệ thống lỗi (Error Hierarchy)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

5 error class dành riêng cho engine, kế thừa từ `PluginError` base. Không dùng `Error` thô trong engine code — mọi lỗi đều phải là `PluginError` hoặc subclass.

Cơ chế:
- `captureStackTrace` — loại bỏ constructor khỏi stack trace, tập trung vào code gây lỗi.
- `Symbol.toStringTag` — cho phép `Object.prototype.toString.call(err)` trả về `[object MissingKeyError]` thay vì `[object Error]`.
- `dedent` — loại bỏ khoảng trắng thừa trong message nhiều dòng.

Source: `src/plugin/errors.ts` (78 dòng).

## Yêu cầu

- `PluginError` là base class — mọi lỗi engine kế thừa từ nó.
- Các subclass tự động thêm hướng dẫn khắc phục vào message (dùng `dedent`).
- `Symbol.toStringTag` getter trả về tên class.
- `Error.captureStackTrace` để stack trace sạch.
- Không dùng `Error` thô trong engine code.

## Thiết kế

### Class hierarchy

```
Error
 └── PluginError
      ├── MissingKeyError
      ├── InvalidEngineError
      ├── EngineTimeoutError
      └── RequestTimeoutError
```

### Base class

```ts
class PluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name; // tự động set tên class
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor); // bỏ constructor khỏi stack
    }
  }
  get [Symbol.toStringTag](): string {
    return this.constructor.name; // [object MissingKeyError] thay vì [object Error]
  }
}
```

### Tại sao dùng captureStackTrace

```ts
// Không có captureStackTrace:
// Error: ...
//   at new MissingKeyError (errors.ts:10)
//   at api (connector/index.ts:81)

// Có captureStackTrace:
// Error: ...
//   at api (connector/index.ts:81)
```

Stack trace ngắn hơn, tập trung vào code gây lỗi.

### Tại sao dùng Symbol.toStringTag

Trong môi trường không hỗ trợ `instanceof` (vd: cross-realm, iframe), `Object.prototype.toString.call(err)` vẫn trả về tên class chính xác.

### Tại sao dùng dedent

Message lỗi viết trong code dạng template string nhiều dòng. `dedent` loại bỏ khoảng trắng thừa ở đầu mỗi dòng — output lỗi gọn gàng, không bị thụt lề.

Tham chiếu design doc: `docs/designs/error-hierarchy.design.md`.

## API / Data flow

```ts
// Base
class PluginError extends Error {
  constructor(message: string);
  get [Symbol.toStringTag](): string;
}

// Subclasses — mỗi class thêm hướng dẫn khắc phục
class MissingKeyError extends PluginError { constructor(message: string); }
class InvalidEngineError extends PluginError { constructor(message: string); }
class EngineTimeoutError extends PluginError { constructor(message: string); }
class RequestTimeoutError extends PluginError { constructor(message: string); }
```

### Chi tiết message từng class

```ts
// MissingKeyError
new MissingKeyError('[msg]')
// Output:
// [msg]
// Do các cập nhật mới nhất, bạn cần chỉ định key không chỉ khi nhận fingerprint,
// mà cả khi áp dụng nó vào browser.

// InvalidEngineError
new InvalidEngineError('[msg]')
// Output:
// [msg]
// Nguyên nhân có thể do engine chưa được tải xuống hoặc giải nén đúng cách.
// Hướng khắc phục:
// 1. Xóa hoàn toàn thư mục engine hiện tại
// 2. Chạy lại code để hệ thống tự tải engine mới
// 3. Nếu vẫn lỗi, hãy mở issue kèm mô tả chi tiết vấn đề

// EngineTimeoutError
new EngineTimeoutError('[msg]')
// Output:
// [msg]
// Bạn có thể điều chỉnh timeout bằng method "setEngineTimeout" -
// phương thức này thiết lập giới hạn thời gian cho việc tải file engine.

// RequestTimeoutError
new RequestTimeoutError('[msg]')
// Output:
// [msg]
// Bạn có thể điều chỉnh timeout bằng method "setRequestTimeout" -
// phương thức này thiết lập giới hạn thời gian cho việc thực thi request của engine.
```

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/errors.ts` | Định nghĩa 5 error classes | 78 |

## Xử lý lỗi

| Error class | Khi nào xảy ra | Message gợi ý thêm |
|---|---|---|
| `PluginError` (base) | Lỗi không thuộc loại cụ thể | Không thêm hướng dẫn |
| `MissingKeyError` | `serviceKey` chưa set khi gọi fetch/setup | Nhắc set key cho cả 2 bước |
| `InvalidEngineError` | Engine chưa tải hoặc giải nén lỗi | 3 bước khắc phục cụ thể |
| `EngineTimeoutError` | `startProcess` quá thời gian | Gợi ý `setEngineTimeout()` |
| `RequestTimeoutError` | `runFunction` quá thời gian | Gợi ý `setRequestTimeout()` |

### Hạn chế hiện tại

Errors chưa được export từ `src/index.ts` (xem KNOWN_ISSUES.md, Issue #14). Trong `catch`, dùng `err.name` để phân biệt:

```ts
try { ... } catch (err: unknown) {
  if (err instanceof Error) {
    switch (err.name) {
      case 'MissingKeyError': ...
      case 'InvalidEngineError': ...
    }
  }
}
```

`instanceof PluginError` hiện không hoạt động nếu import từ package riêng.

## Kiểm tra

- Happy path: `throw new PluginError('msg')` → `err.name === 'PluginError'`.
- Inheritance: `err instanceof PluginError === true` cho mọi subclass.
- Stack: `err.stack` không chứa constructor line (nhờ `captureStackTrace`).
- toStringTag: `Object.prototype.toString.call(err)` trả về `[object MissingKeyError]`.
- Message format: `MissingKeyError` message có thêm hướng dẫn (`dedent` format đúng).
