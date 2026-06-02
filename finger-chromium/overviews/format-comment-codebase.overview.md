# Overview: Format và Comment lại toàn bộ Codebase

## Kết quả

Hoàn thành toàn bộ 25 file TypeScript trong `src/` theo đúng spec và plan đã duyệt.

## So sánh Plan vs Thực tế

| Bước | Nội dung | Trạng thái |
|---|---|---|
| 1-7 | Nhóm 1 -- Core (7 file) | Hoàn thành |
| 8-18 | Nhóm 2 -- Hỗ trợ (11 file) | Hoàn thành |
| 19-25 | Nhóm 3 -- Types & misc (7 file) | Hoàn thành |
| 26-28 | Kiểm tra: format, lint, build | Hoàn thành |
| 29 | Viết overview | Hoàn thành |
| 30 | Cập nhật roadmap | Hoàn thành |

## Sai lệch so với Plan

- **Plan thiếu file `src/adapter/playwright/loader.ts`** (5 dòng) -- phát hiện trong lúc review, đã thêm vào plan thành Bước 6 và đánh số lại.
- **Build script `rm -rf dist` không tương thích Windows** -- lỗi pre-existing, không ảnh hưởng đến kết quả (dùng `npx tsup` thay thế).

## Chi tiết thay đổi

### Header comment
- 25/25 file có header mô tả luồng hoạt động chính (dạng danh sách có thứ tự 1-5 bước).
- Format: `// ─── File: path ───` với ký tự Unicode U+2500.

### Section divider
- 25/25 file có divider phân chia rõ ràng (Types, Constants, Profile, Runtime, Configuration Methods, Lifecycle Methods, Export).

### JSDoc
- Mọi `export` public đều có JSDoc (`@param`, `@returns`, `@throws`, `@default`, `@example`).
- Private field chỉ có JSDoc khi logic không hiển nhiên.

### Inline step comments
- Các hàm phức tạp (`_launch`, `runFunction`, `startProcessInternal`, `quit`, `launch`) có `// --- Bước N:`.
- Format: `// --- Bước N: Mô tả -- lý do tại sao`.

### Giải thích WHY
- Comment giải thích *tại sao* thay vì chỉ *làm gì*.
- Ví dụ: "headless: false vì fingerprint check phát hiện headless mode".

## Kiểm tra

- `npm run format` (Prettier) -- pass, 23/25 file unchanged
- `npm run lint` (ESLint) -- 0 errors, 16 warnings (all pre-existing `no-explicit-any`)
- `npm run build` (tsup) -- ESM + CJS + DTS build thành công

## Ghi chú

- Task non-feature: không cần product doc.
- Tất cả thay đổi chỉ giới hạn ở comment, không sửa logic code.

---

Xem thêm: [Design](../designs/format-comment-codebase.design.md) | [Spec](../specs/format-comment-codebase.spec.md) | [Plan](../plans/format-comment-codebase.plan.md)