# Design: Sửa lỗi biến `serviceKey` ở module scope gây dùng chung key giữa các instance

## Bối cảnh

`let serviceKey` ở `src/plugin/index.ts:61` là biến module-level, nghĩa là tất cả `FingerprintPlugin` instance đều đọc/ghi chung một biến. Khi có nhiều instance tồn tại song song:

- Instance A gọi `setServiceKey(keyA)` -> module-level `serviceKey = keyA`
- Instance B gọi `setServiceKey(keyB)` -> module-level `serviceKey = keyB`
- Instance A gọi `fetch()` -> dùng `serviceKey` hiện tại là `keyB` (sai)

Đây là bug class — dạng lỗi "module-level mutable state" đã từng xảy ra ở nhiều chỗ khác trong codebase (AsyncLock #22, cleaner #6, remote engine #7, defaultLauncher #3).

## Câu hỏi làm rõ

- Có instance nào cần chia sẻ serviceKey không? -> Không. Mỗi instance nên có key riêng.
- `fetch()` và `_launch()` dùng `serviceKey` làm fallback khi `options.key` không được truyền -> Đúng. Cần giữ behavior này nhưng trên per-instance.
- Có test nào phụ thuộc vào module-level serviceKey không? -> Cần kiểm tra.

## Các phương án

### Phương án 1: Chuyển sang private instance field `#serviceKey`

Đưa `serviceKey` từ `let serviceKey` module scope vào làm private field `#serviceKey` của class `FingerprintPlugin`.

- **Ưu điểm:**
  - Đơn giản, ít thay đổi — chỉ sửa 3-4 dòng.
  - Đúng pattern ES2020 private field (dùng `#`), an toàn hơn `private`.
  - Nhất quán với các private field khác (`#cleaner`, `#connector`, `#configManager`).
  - Không ảnh hưởng public API vì `setServiceKey()` vẫn là method công khai.

- **Nhược điểm:**
  - Module-level template ở section "Constants" biến mất, cần dọn section divider.

### Phương án 2: Dùng WeakMap để lưu key theo instance

Giữ nguyên `let serviceKey` module-level nhưng dùng `WeakMap<FingerprintPlugin, string>` để map instance -> key.

- **Ưu điểm:** Có thể quản lý lifecycle tự động qua GC.
- **Nhược điểm:** Overengineer — WeakMap phức tạp hơn private field, không cần thiết cho bài toán đơn giản này.

### Phương án 3: Dùng `private serviceKey`

Dùng `private` thay vì `#` (TypeScript `private`).

- **Ưu điểm:** Tương tự `#serviceKey`.
- **Nhược điểm:** `private` chỉ là compile-time check, runtime vẫn truy cập được. Không nhất quán với các field khác đang dùng `#`.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (private instance field `#serviceKey`)
  - Lý do: Đơn giản, an toàn, nhất quán với codebase.
- **Phương án được chọn:** (do người duyệt điền)
- **Lý do:** (do người duyệt điền)
- **Ràng buộc hoặc điều kiện kèm theo:**
  - Xoá section divider "Constants" sau khi dọn biến module scope (nếu section đó trống).
  - Kiểm tra test files có dùng `serviceKey` như module-level biến không.
