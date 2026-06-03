# Design: Bug #2 — Error classes không export trong public API

## Bối cảnh

`src/plugin/errors.ts` định nghĩa 5 class lỗi (`PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`) nhưng `src/index.ts` (public API) không re-export chúng. Người dùng không thể `import { PluginError } from 'fingerprint-chromium-engine'` để catch lỗi đúng type.

## Câu hỏi làm rõ

- Có cần export type riêng cho các error class không? → Không. Đây là class thuần, export trực tiếp là đủ.
- Có ảnh hưởng gì đến tree-shaking không? → Không đáng kể. Các class này đã được import và dùng nội bộ, chỉ thêm re-export.

## Các phương án

### Phương án 1: Re-export trực tiếp từ `src/index.ts`

```ts
// src/index.ts
export {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from './plugin/errors';
```

- **Ưu điểm:** Đơn giản, 1 block export là xong.
- **Nhược điểm:** Không có.

### Phương án 2: Export qua barrel file `src/plugin/index.ts`

Tạo export ở `src/plugin/index.ts` rồi re-export từ `src/index.ts`.

- **Ưu điểm:** Nhất quán nếu sau này có nhiều plugin export hơn.
- **Nhược điểm:** `src/plugin/index.ts` hiện tại là `FingerprintPlugin` — không nên nhồi thêm error classes vào đó. Thêm 1 lớp gián tiếp không cần thiết.

### Phương án 3: Tách errors vào file riêng trong `src/` level

Move `src/plugin/errors.ts` lên `src/errors.ts`.

- **Ưu điểm:** Ngắn import path hơn.
- **Nhược điểm:** Phá vỡ cấu trúc thư mục. `errors.ts` thuộc plugin, không phải top-level concept.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1.
- **Phương án được chọn:** (do người duyệt điền sau)
- **Lý do:** Thay đổi tối thiểu (thêm 6 dòng vào `src/index.ts`). Không phá vỡ cấu trúc hiện tại.
- **Ràng buộc hoặc điều kiện kèm theo (nếu có):** Không.
