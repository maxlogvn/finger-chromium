# Spec: Bug #2 — Error classes không export trong public API

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

5 error class trong `src/plugin/errors.ts` không được re-export qua `src/index.ts`. Người dùng không thể import chúng để catch lỗi theo type.

## Yêu cầu

- `PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError` phải được export từ `fingerprint-chromium-engine`.
- Backward compatible: các export hiện tại không bị ảnh hưởng.

## Thiết kế

Tham chiếu design: `docs/designs/bug-002-export-error-classes.design.md`

Phương án được chọn: thêm block re-export từ `./plugin/errors` vào `src/index.ts`.

## API / Data flow

```ts
import {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from 'fingerprint-chromium-engine';

try {
  const context = await engine.launch().newContext();
} catch (error) {
  if (error instanceof MissingKeyError) {
    // Hướng dẫn user set key
  }
}
```

## Components

| File | Sửa | Chi tiết |
|---|---|---|
| `src/index.ts` | Thêm 6 dòng | Thêm export block cho 5 error class từ `./plugin/errors` |

## Xử lý lỗi

Không có lỗi mới phát sinh.

## Kiểm tra

- Happy path: import được tất cả 5 error class từ package.
- Edge case: các export cũ vẫn hoạt động bình thường.
