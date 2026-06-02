# Spec: Format và Comment lại toàn bộ Codebase

## Mô tả

Áp dụng nhất quán các quy tắc comment và format code từ `docs/CONVENTIONS.md` lên toàn bộ 25 file TypeScript trong `src/`. Không thay đổi logic code.

## Yêu cầu

1. **Header đầu file** -- comment `//` mô tả luồng hoạt động chính, dạng danh sách có thứ tự. Không dùng JSDoc `/** @file */`.
2. **Section divider** -- `// ─── Tên phần ───` để chia file thành các phần rõ ràng.
3. **Inline comment** -- `// --- Bước N:` để đánh dấu từng bước xử lý trong hàm.
4. **JSDoc** -- mọi `export` public phải có JSDoc (`@param`, `@returns`, `@throws`, `@default`, `@example`). Private field chỉ cần JSDoc nếu logic không hiển nhiên.
5. **Giải thích WHY** -- comment phải giải thích *tại sao* chứ không chỉ *làm gì*.
6. **Vị trí lifecycle** -- thứ tự bước lifecycle đặt ở inline comment trước hàm, không trong JSDoc.

## Thiết kế

### Thứ tự xử lý file

Chia làm 3 nhóm, xử lý từ quan trọng nhất:

| Nhóm | File | Độ ưu tiên | Lý do |
|---|---|---|---|
| 1 | `plugin/index.ts`, `adapter/playwright/*.ts`, `loader/index.ts` | Cao | Core engine, nhiều người đọc nhất |
| 2 | `plugin/browser.ts`, `plugin/config.ts`, `plugin/cleaner.ts`, `plugin/utils.ts`, `plugin/connector/*.ts`, `plugin/launcher/index.ts`, `plugin/mutex/index.ts`, `common/index.ts` | Trung bình | Hỗ trợ, ít người đọc hơn |
| 3 | `types/*.ts`, `index.ts`, `plugin/errors.ts` | Thấp | Đã có JSDoc tốt (types) hoặc quá ngắn |

### Format header

```ts
// ─── File: ten-file.ts ───────────────────────────────────────────────────
// Mô tả ngắn (1 dòng) về namespace/module này.
//
//   1. Bước đầu tiên
//   2. Bước thứ hai
//   3. Bước thứ ba
// ─────────────────────────────────────────────────────────────────────────────
```

### Format section divider

```ts
// ─── Types ────────────────────────────────────────────────────────────────────
// ─── Constants ────────────────────────────────────────────────────────────────
// ─── Profile ──────────────────────────────────────────────────────────────────
// ─── Runtime ──────────────────────────────────────────────────────────────────
// ─── Configuration Methods ────────────────────────────────────────────────────
// ─── Lifecycle Methods ────────────────────────────────────────────────────────
// ─── Export ───────────────────────────────────────────────────────────────────
```

### Format JSDoc

```ts
/**
 * Mô tả chức năng -- giải thích WHY.
 *
 * @param ten - Mô tả tham số
 * @returns Mô tả giá trị trả về
 * @throws {PluginError} Khi nào throw lỗi
 * @default 'value'
 * @example
 * ```
 * const result = myFunction('input');
 * ```
 */

### Format inline step

```ts
// --- Bước 1: Hợp nhất options -- lý do tại sao
code...

// --- Bước 2: Cấu hình engine -- lý do tại sao
code...
```

## Components

Không có component mới. Đây là task thay đổi comment trên code hiện có.

## Xử lý lỗi

- Không throw lỗi mới
- Nếu Prettier/ESLint thay đổi format, chạy `npm run format` và `npm run lint:fix`

## Kiểm tra

- `npm run lint` -- ESLint không có lỗi mới
- `npm run build` -- tsup bundle không lỗi

---

Xem thêm: [Design](../designs/format-comment-codebase.design.md) | [Plan](../plans/format-comment-codebase.plan.md)
