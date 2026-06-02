# Design: Format và Comment lại toàn bộ Codebase

## Vấn đề

Toàn bộ codebase hiện tại không tuân thủ các quy tắc trong `docs/CONVENTIONS.md` về comment và format code:

- **0/25 file** có header comment mô tả luồng hoạt động chính
- **2/25 file** có section divider
- **7/25 file** có JSDoc trên export (chỉ types/ là đầy đủ)
- **0/25 file** có inline step comments `// --- Bước N:`
- **56% file** có comment chỉ mô tả WHAT, không giải thích WHY

## Mục tiêu

Đưa toàn bộ codebase về đúng chuẩn CONVENTIONS.md, gồm:

1. Header comment đầu mỗi file (dùng `───` U+2500 kẻ đường viền)
2. Section divider phân chia rõ ràng (dùng `───` U+2500)
3. JSDoc cho mọi export public
4. Inline step comments trong hàm phức tạp (dùng `---` ASCII, không dùng `───`)
5. Comment giải thích WHY thay vì chỉ WHAT

## Phạm vi

- **25 file TypeScript** trong `src/` (adapter, common, loader, plugin, types)
- **Không** sửa logic code, chỉ thêm/sửa comment
- **Không** sửa file trong `tests/`, `dist/`, `node_modules/`

## Phương án

### Phương án A (khuyến nghị): Làm thủ công từng file

- Đọc từng file, phân tích luồng chính
- Viết header, divider, JSDoc, step comments phù hợp
- Đảm bảo mỗi comment giải thích WHY

**Ưu điểm:** Chất lượng cao, comment sát với code thật
**Nhược điểm:** Tốn thời gian, cần hiểu rõ code

### Phương án B: Tự động hoá một phần

- Script tự động thêm divider template
- Sau đó sửa tay nội dung

**Ưu điểm:** Nhanh hơn một chút
**Nhược điểm:** Vẫn cần sửa tay nhiều, nguy cơ sai format

## Kết luận

Chọn **Phương án A** -- làm thủ công từng file, đi từ file quan trọng nhất (plugin/index.ts, engine.ts, data.ts, utils.ts) đến các file ít quan trọng hơn.

---

Xem thêm: [Spec](../specs/format-comment-codebase.spec.md) | [Plan](../plans/format-comment-codebase.plan.md)
