# Task: Unit Tests cho Core (`tests/unit/core.spec.ts`)

> Kiểm tra các thành phần không cần browser: error classes, types, config.

## Mô tả

Tạo file `tests/unit/core.spec.ts` với các unit test cho những module không phụ thuộc `BABLOSOFT_KEY` hay browser thật.

## Nội dung cần test

### Error Classes

Test tất cả error class từ `src/plugin/errors.ts`:
- `PluginError` -- base error, message + name.
- `MissingKeyError` -- kế thừa `PluginError`, message mặc định.
- `InvalidEngineError` -- kế thừa `PluginError`.
- `EngineTimeoutError` -- kế thừa `PluginError`.
- `RequestTimeoutError` -- kế thừa `PluginError`.

Mỗi class test:
- `new XXXError()` không tham số.
- `new XXXError("custom message")` với custom message.
- `instanceof PluginError` (`instanceof` chain).

### Export check

Đảm bảo các export từ `src/index.ts` tồn tại và đúng kiểu:
- `BrowserEngine` là class.
- Các error class kế thừa `PluginError`.
- Các type export là object types.

### Config (nếu có logic phức tạp)

Test các hàm trong `src/plugin/config.ts` nếu có logic xử lý.

## Tiêu chí hoàn thành

- Chạy được với `npm test`, không cần biến môi trường nào.
- Không spawn browser hay engine.
- Mỗi describe group cho một nhóm (errors, exports, config).
