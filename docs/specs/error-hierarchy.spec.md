# Spec: Hệ thống lỗi (Error Hierarchy)

## Mô tả

Phân cấp lỗi cho toàn bộ engine. Base class `PluginError` kế thừa `Error`, tự động set `name`.

## Các class

| Class | Kế thừa | Khi nào dùng |
|---|---|---|
| `PluginError` | `Error` | Base, lỗi chung |
| `MissingKeyError` | `PluginError` | Thiếu key |
| `InvalidEngineError` | `PluginError` | Engine lỗi/chưa tải |
| `EngineTimeoutError` | `PluginError` | Timeout khởi động |
| `RequestTimeoutError` | `PluginError` | Timeout request |

## Thiết kế

```ts
class PluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

Mỗi subclass thêm hướng dẫn khắc phục vào message qua `dedent`.

## Kiểm tra

- `npm run lint` -- không lỗi
- `npm run build` -- build thành công

---

Xem thêm: [Design](../designs/error-hierarchy.design.md) | [Plan](../plans/error-hierarchy.plan.md)
