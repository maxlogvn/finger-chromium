# Spec: Bug #4 — JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

JSDoc của interface `PWChromium` (dòng 17 và 25, file `src/types/PWChromium.ts`) tham chiếu `usePrivateKey()` — method không tồn tại. Key bảo mật thực tế được đọc từ biến môi trường `BABLOSOFT_KEY`.

## Yêu cầu

- JSDoc không được tham chiếu method không tồn tại.
- Example code trong JSDoc phải loại bỏ dòng `.usePrivateKey()`.
- Phải có hướng dẫn user set biến môi trường `BABLOSOFT_KEY`.

## Thiết kế

Tham chiếu design: `docs/designs/bug-004-jsdoc-privatekey.design.md`

Phương án được chọn: sửa JSDoc, không thêm method mới.

## Components

| File | Sửa | Chi tiết |
|---|---|---|
| `src/types/PWChromium.ts:17` | Xoá `usePrivateKey` khỏi JSDoc | Thay bằng ghi chú về biến môi trường |
| `src/types/PWChromium.ts:25` | Xoá dòng `.usePrivateKey('your-private-key')` | Thay bằng comment `// can set BABLOSOFT_KEY env` |

## Xử lý lỗi

Không có lỗi mới — chỉ sửa comment, không động đến logic.

## Kiểm tra

- `npm run lint` — không có lỗi mới.
- `npm run build` — build thành công.
