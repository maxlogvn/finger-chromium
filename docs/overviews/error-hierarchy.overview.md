# Overview: Hệ thống lỗi (Error Hierarchy)

## Mục tiêu

Xây dựng hệ thống lỗi có phân cấp, dễ catch và xử lý riêng cho từng loại lỗi, kèm message hướng dẫn khắc phục chi tiết.

## Kết quả

- 1 base class `PluginError` + 4 subclass trong `src/plugin/errors.ts` (78 dòng).
- `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`.
- Tất cả đều dùng `dedent` để format message.
- Được import và sử dụng trong `connector/engine.ts` và `connector/index.ts`.

## Kiểm tra

- `npm run lint` -- 0 errors, không có unused variables/classes.
- Các error classes được dùng trong 2 file connector.
- `dedent` có trong dependencies (version `1.7.2`).

## Sai lệch so với kế hoạch

| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| Không có | `Symbol.toStringTag` được thêm vào | Giúp `String(error)` hiển thị tên class thay vì `'Error'` |

## Ghi chú kỹ thuật

- `dedent` loại bỏ khoảng trắng thừa trong template literal. Nếu không có, message lỗi sẽ bị indent sâu khi log ra console.
- `Error.captureStackTrace` được kiểm tra `if (typeof === 'function')` trước khi gọi, an toàn trên mọi runtime.
- Tên class được tự động gán vào `this.name` để `instanceof` hoạt động chính xác.

---
