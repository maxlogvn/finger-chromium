# Overview: Hệ thống lỗi (Error Hierarchy)

## Tóm tắt

Đã tạo 5 error class trong `src/plugin/errors.ts`: `PluginError` (base) + 4 subclass (`MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`). Base class có `Error.captureStackTrace` và `Symbol.toStringTag`. Mỗi class có constructor nhận message string, dùng `dedent` cho multi-line message.

## Kiến trúc

```
PluginError (base)
  |-- Error.captureStackTrace(this, this.constructor)  -- V8 stack trace
  |-- Symbol.toStringTag -> class name                 -- instanceof check
  |-- this.name = this.constructor.name                -- subclass auto
  |
  |-- MissingKeyError      -- thiếu BABLOSOFT_KEY
  |-- InvalidEngineError   -- engine chưa tải/không tìm thấy
  |-- EngineTimeoutError   -- timeout engine start
  |-- RequestTimeoutError  -- timeout request IPC
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `DEFAULT_ERROR_MESSAGES` | `src/plugin/errors.ts` | 6-8 |
| `PluginError` class | `src/plugin/errors.ts` | 10-36 |
| `MissingKeyError` class | `src/plugin/errors.ts` | 38-50 |
| `InvalidEngineError` class | `src/plugin/errors.ts` | 52-64 |
| `EngineTimeoutError` class | `src/plugin/errors.ts` | 66-78 |
| `RequestTimeoutError` class | `src/plugin/errors.ts` | 80-94 |

## Message mẫu

**MissingKeyError:**
```
Private key not specified. Please provide your private key from the
bablosoft.com website in the account section.
```

**InvalidEngineError:**
```
Engine does not exist. Must specify or upload the engine.
```

**EngineTimeoutError:**
```
Engine runtime error. Recovery is not possible.
```

**RequestTimeoutError:**
```
Request timeout.
```

## Quyết định thiết kế

- **`Error.captureStackTrace(this, this.constructor)`**: Target `this` (instance), skip constructor function khỏi stack trace. Chỉ V8 (Node.js, Chrome) -- không fallback cho các engine JS khác.
- **`Symbol.toStringTag`**: `Object.prototype.toString.call(new PluginError())` -> `[object PluginError]` thay `[object Error]`. Cần thiết cho logging library dùng `Object.prototype.toString` để xác định type.
- **`this.name = this.constructor.name`**: Subclass tự động kế thừa -- không cần override. `instanceof` check hoạt động đúng.
- **`dedent`**: Format multi-line message -- bỏ leading whitespace. Giúp message dễ đọc trong source code.
- **`DEFAULT_ERROR_MESSAGES`**: Constants riêng -- dễ thay đổi message (đa ngữ, custom).
- **Không dùng `Error` thô**: `PluginError` hierarchy cho phép catch chính xác (`catch (e: PluginError)`).

## Sai lệch đã biết

- `PluginError` chưa được re-export public từ `src/index.ts` (KNOWN_ISSUES.md #2).
- `MissingKeyError` message không cố định 3 dòng -- nó gồm dynamic message + 2 dòng hướng dẫn cố định (dùng `dedent`).

## Lưu ý

- Tất cả errors dùng `dedent` để format message multi-line.
- `Error.captureStackTrace` chỉ V8 (Node.js, Chrome).
- `as const` cho `DEFAULT_ERROR_MESSAGES` -- TypeScript infer literal type, không mutate.
- Message giải thích rõ nguyên nhân + hướng khắc phục.

## Tài liệu liên quan

- `docs/designs/error-hierarchy.design.md`
- `docs/specs/error-hierarchy.spec.md`
- `docs/plans/error-hierarchy.plan.md`
- `docs/products/error-hierarchy.product.md`
- `src/plugin/errors.ts`
