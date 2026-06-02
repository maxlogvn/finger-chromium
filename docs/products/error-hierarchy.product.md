# Product: Hệ thống lỗi (Error Hierarchy)

## Mô tả

5 error class dành riêng cho engine, kế thừa từ `PluginError` base. Mỗi class tự động thêm hướng dẫn khắc phục vào message (dùng `dedent` để giữ format).

```
PluginError (base)
├── MissingKeyError      — thiếu key bảo mật
├── InvalidEngineError   — engine chưa tải/giải nén
├── EngineTimeoutError   — timeout khởi động engine
└── RequestTimeoutError  — timeout chờ response
```

## Cách sử dụng

Hiện tại errors chưa được export public (xem KNOWN_ISSUES.md #2). Dùng `err.name` để phân biệt:

```ts
try {
  await Chromium.launch();
} catch (err: unknown) {
  if (err instanceof Error) {
    switch (err.name) {
      case 'MissingKeyError':
        console.error('Thiếu key:', err.message);
        break;
      case 'InvalidEngineError':
        console.error('Engine lỗi:', err.message);
        break;
      case 'EngineTimeoutError':
      case 'RequestTimeoutError':
        console.error('Timeout:', err.message);
        break;
      default:
        console.error('Lỗi engine:', err.message);
    }
  }
}
```

## Hành vi chi tiết

| Error class | Khi nào xảy ra | Message gợi ý thêm |
|---|---|---|
| `MissingKeyError` | `serviceKey` chưa set khi gọi fetch/setup | "bạn cần chỉ định key không chỉ khi nhận fingerprint, mà cả khi áp dụng nó vào browser" |
| `InvalidEngineError` | Engine chưa tải hoặc giải nén lỗi | "xoá engine folder, chạy lại, mở issue nếu còn lỗi" |
| `EngineTimeoutError` | startProcess quá thời gian | "dùng `setEngineTimeout()` để tăng timeout" |
| `RequestTimeoutError` | runFunction quá thời gian | "dùng `setRequestTimeout()` để tăng timeout" |

### Tại sao dùng `dedent`

Message lỗi viết trong code dạng template string nhiều dòng. `dedent` loại bỏ khoảng trắng thừa ở đầu mỗi dòng — giúp code dễ đọc và output lỗi gọn gàng.

### Tại sao dùng `captureStackTrace`

`captureStackTrace` (V8 API) loại bỏ constructor khỏi stack trace — stack trace ngắn hơn, tập trung vào code gây lỗi thay vì dòng `new Error()`.

### Tại sao dùng `Symbol.toStringTag`

Cho phép `Object.prototype.toString.call(err)` trả về `[object MissingKeyError]` thay vì `[object Error]`. Hữu ích khi debug trong các framework log tự động gọi `.toString()`.

## Giới hạn và điều kiện

- Chưa thể import errors từ package (KNOWN_ISSUES.md #2). Dùng `err.name` thay thế.
- `instanceof PluginError` hiện không hoạt động nếu import từ package.
- Tất cả message lỗi viết bằng tiếng Việt.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/error-hierarchy.spec.md`
- Design: `docs/designs/error-hierarchy.design.md`
- Source: `src/plugin/errors.ts`
