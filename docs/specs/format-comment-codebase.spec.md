# Spec: Format và Comment lại toàn bộ Codebase

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Áp dụng nhất quán các quy tắc comment và format code từ `docs/CONVENTIONS.md` lên toàn bộ 25 file TypeScript trong `src/`. Không thay đổi logic code.

## Yêu cầu

1. Header đầu file -- comment `//` mô tả luồng hoạt động chính, dạng danh sách có thứ tự.
2. Section divider -- `// ─── Tên phần ───` chia file thành các phần rõ ràng.
3. Inline comment -- `// --- Bước N:` đánh dấu từng bước xử lý trong hàm.
4. JSDoc -- mọi export public phải có JSDoc (`@param`, `@returns`, `@throws`, `@default`).
5. Giải thích WHY -- comment phải giải thích *tại sao* chứ không chỉ *làm gì*.

## Thiết kế

Thứ tự xử lý:

| Nhóm | File | Ưu tiên |
|---|---|---|
| 1 | `plugin/index.ts`, `adapter/playwright/*`, `loader/index.ts` | Cao |
| 2 | `plugin/browser.ts`, `plugin/config.ts`, `plugin/cleaner.ts`, `plugin/connector/*`, `plugin/launcher/*`, `plugin/mutex/*`, `common/index.ts` | Trung bình |
| 3 | `types/*`, `index.ts`, `plugin/errors.ts` | Thấp |

Xem [Design](../designs/format-comment-codebase.design.md).

## Components

Không có component mới. Task thay đổi comment trên code hiện có.

## Xử lý lỗi

- Nếu Prettier/ESLint thay đổi format, chạy `npm run format` và `npm run lint:fix`.
- Không throw lỗi mới.

## Kiểm tra

- `npm run lint` -- ESLint không có lỗi mới.
- `npm run build` -- tsup bundle không lỗi.
