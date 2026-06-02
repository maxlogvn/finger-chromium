# Spec: Hệ thống lỗi (Error Hierarchy)

## Mô tả

Hệ thống lỗi gồm 1 base class (`PluginError`) và 4 subclass, tất cả định nghĩa trong `src/plugin/errors.ts`. Mỗi class kế thừa `PluginError`, tự động set `name` và stack trace.

## API / Interfaces chính

### `PluginError`

```ts
class PluginError extends Error {
  constructor(message: string);
  get [Symbol.toStringTag](): string;  // Trả về 'PluginError'
}
```

- Dùng cho lỗi cơ bản không thuộc loại cụ thể.
- `this.name` tự động là tên class.
- Stack trace được capture qua `Error.captureStackTrace`.

### `MissingKeyError extends PluginError`

```
constructor(message: string)
  → super(dedent`${message}
       Do các cập nhật mới nhất, bạn cần chỉ định key không chỉ khi nhận fingerprint,
       mà cả khi áp dụng nó vào browser.`)
```

- Throw khi không có key bảo mật.
- Message kèm hướng dẫn về việc cần set key cho cả fetch và apply.

### `InvalidEngineError extends PluginError`

```
constructor(message: string)
  → super(dedent`${message}
       Nguyên nhân có thể do engine chưa được tải xuống hoặc giải nén đúng cách.
       Hướng khắc phục:
       1. Xóa hoàn toàn thư mục engine hiện tại
       2. Chạy lại code để hệ thống tự tải engine mới
       3. Nếu vẫn lỗi, hãy mở issue kèm mô tả chi tiết vấn đề`)
```

- Throw khi engine binary không chạy được.
- Message kèm 3 bước khắc phục.

### `EngineTimeoutError extends PluginError`

```
constructor(message: string)
  → super(dedent`${message}
       Bạn có thể điều chỉnh timeout bằng method "setEngineTimeout" -
       phương thức này thiết lập giới hạn thời gian cho việc tải file engine.`)
```

- Throw khi download + extract + spawn engine vượt quá thời gian cho phép.
- Có thể cấu hình qua `setEngineTimeout()`.

### `RequestTimeoutError extends PluginError`

```
constructor(message: string)
  → super(dedent`${message}
       Bạn có thể điều chỉnh timeout bằng method "setRequestTimeout" -
       phương thức này thiết lập giới hạn thời gian cho việc thực thi request của engine.`)
```

- Throw khi chờ phản hồi IPC từ engine vượt quá thời gian cho phép.
- Có thể cấu hình qua `setRequestTimeout()`.

## Luồng dữ liệu

```
Code gặp lỗi
    │
    ▼
throw new XXXError('message')
    │
    ▼
catch (err)
    │
    ├── if (err instanceof MissingKeyError) → yêu cầu set key
    ├── if (err instanceof EngineTimeoutError) → tăng timeout
    ├── if (err instanceof InvalidEngineError) → tải lại engine
    ├── if (err instanceof RequestTimeoutError) → tăng request timeout
    └── else → lỗi không xác định
```

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/errors.ts` | Định nghĩa tất cả error classes |
| `src/plugin/connector/engine.ts` | Dùng `EngineTimeoutError`, `InvalidEngineError`, `RequestTimeoutError` |
| `src/plugin/connector/index.ts` | Dùng `PluginError`, `MissingKeyError` |

## Xử lý lỗi

Các lỗi được throw từ `connector/engine.ts` và `connector/index.ts`. Không để error raw bubble lên -- tất cả đều được bọc trong `PluginError` hierarchy.

Ví dụ code catch:

```ts
import { PluginError, MissingKeyError, EngineTimeoutError } from 'fingerprint-chromium-engine';

try {
  await Chromium.launch();
} catch (err) {
  if (err instanceof MissingKeyError) {
    console.error('Vui lòng set BABLOSOFT_KEY trong biến môi trường.');
  } else if (err instanceof EngineTimeoutError) {
    console.error('Quá trình tải engine quá lâu. Kiểm tra kết nối mạng.');
  } else if (err instanceof PluginError) {
    console.error(`Lỗi engine: ${err.message}`);
  } else {
    throw err; // Lỗi không phải từ engine
  }
}
```

## Ghi chú kỹ thuật

- `dedent` được dùng để loại bỏ khoảng trắng thừa từ template literal, giúp message lỗi gọn gàng khi log ra console.
- `Error.captureStackTrace` chỉ có trên V8 (Node.js, Chrome). Trên runtime khác, nó là `undefined` -- code đã kiểm tra `if (Error.captureStackTrace)` trước khi gọi.
- `Symbol.toStringTag` giúp `String(error)` trả về tên class thay vì `Error`.

---
