# Plan: Hệ thống lỗi (Error Hierarchy)

## Các bước thực hiện

- [x] **Bước 1: Tạo `src/plugin/errors.ts`**
  - Định nghĩa `PluginError extends Error`:
    - Constructor nhận `message: string`, gọi `super(message)`.
    - Set `this.name = this.constructor.name`.
    - Gọi `Error.captureStackTrace` nếu có.
    - Thêm `Symbol.toStringTag` getter.
  - Định nghĩa `MissingKeyError extends PluginError`:
    - Message kèm hướng dẫn về set key cho cả fetch và apply.
  - Định nghĩa `InvalidEngineError extends PluginError`:
    - Message kèm 3 bước khắc phục (xoá engine, tải lại, báo issue).
  - Định nghĩa `EngineTimeoutError extends PluginError`:
    - Message kèm hướng dẫn setEngineTimeout.
  - Định nghĩa `RequestTimeoutError extends PluginError`:
    - Message kèm hướng dẫn setRequestTimeout.
  - Dùng `dedent` package để format message template.

- [x] **Bước 2: Import và sử dụng trong connector**
  - `connector/engine.ts`: throw `EngineTimeoutError`, `InvalidEngineError`, `RequestTimeoutError`.
  - `connector/index.ts`: throw `PluginError`, `MissingKeyError`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/errors.ts` | Định nghĩa 5 error classes |
| `src/plugin/connector/engine.ts` | Runtime errors |
| `src/plugin/connector/index.ts` | Config errors |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Các error classes được import và dùng trong codebase, không có unused export.

## Ghi chú

- `dedent` là dependency -- cần đảm bảo có trong `package.json` dependencies.
- Tất cả error message đều viết bằng tiếng Việt để phù hợp với người dùng chính.

---
