# Design: Dead export SettingsCleaner default

## Bối cảnh

Trong `src/plugin/cleaner.ts:118`, tồn tại dòng `export default new SettingsCleaner()`. Đây là singleton cũ,
còn sót lại từ trước khi refactor per-instance cleaner (GitHub issue #13 / local #6). Sau khi `FingerprintPlugin`
chuyển sang tạo `#cleaner = new SettingsCleaner()` riêng, **không có file production nào import default export này nữa**.

Duy nhất file test `tests/quit-cleanup.test.ts:20` (`import cleaner from '../src/plugin/cleaner'`) import nó.

### Tác động

- Instance chết tồn tại trong memory suốt vòng đời process (~1KB).
- Developer mới có thể import sai (`import cleaner from './cleaner'` thay vì `new SettingsCleaner()`).
- Cần deprecation warning nếu muốn xoá ở major version 2.0.

## Câu hỏi làm rõ

- **Có nên thêm Proxy deprecation warning không?** `export default new Proxy(new SettingsCleaner(), handler)` để cảnh báo khi ai đó truy cập default export.
  → Trả lời: Có thể làm optional -- không bắt buộc, chỉ thêm nếu muốn deprecated rõ ràng.

- **Có nên xoá hẳn dòng `export default` không?** Không, vì vẫn còn test import nó, và backward compatibility ở minor version.
  → Trả lời: Gắn `@deprecated` JSDoc. Xoá ở major version 2.0.

## Các phương án

### Phương án 1: Chỉ thêm `@deprecated` JSDoc (đơn giản nhất)

Thêm JSDoc `@deprecated` vào dòng `export default new SettingsCleaner()`.
Refactor test dùng named import `SettingsCleaner` + `new SettingsCleaner()`.

- Ưu điểm: Đơn giản, ít thay đổi, dễ review.
- Nhược điểm: Không có runtime warning -- developer vẫn có thể import sai mà không biết.

### Phương án 2: Thêm `@deprecated` JSDoc + Proxy deprecation warning

Giống phương án 1, nhưng thêm Proxy wrapper để log warning ở runtime khi ai đó truy cập
thuộc tính của default export.

- Ưu điểm: Cảnh báo rõ ràng ở runtime.
- Nhược điểm: Phức tạp hơn một chút, `Proxy` có overhead nhỏ.

### Phương án 3: Xoá hẳn default export

Xoá dòng `export default new SettingsCleaner()` và sửa test tương ứng.

- Ưu điểm: Dọn dẹp triệt để.
- Nhược điểm: Breaking change ở minor version -- không phù hợp với semver.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (chỉ thêm `@deprecated` JSDoc).
  Lý do: Issue mô tả rõ "dependency không production nào import", phương án đơn giản nhất
  giải quyết đúng vấn đề mà không thêm complexity không cần thiết. Proxy warning là optional
  và có thể thêm sau nếu cần.

- **Phương án được chọn:** (người duyệt điền sau)

- **Lý do:** ...

- **Ràng buộc hoặc điều kiện kèm theo (nếu có):** ...
