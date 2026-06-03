# Design: Bug #3 — `quit()` xoá toàn bộ `BROWSER_RUNNING_DIR`

## Bối cảnh

`BrowserEngine.quit()` (dòng 211, `chromium.ts`) gọi `this.dataManager.unmap(BROWSER_RUNNING_DIR)` để dọn temp dir. `BROWSER_RUNNING_DIR` là thư mục gốc `.tmp/browser/running/` dùng chung cho mọi instance. `unmap()` dùng `fs.rmSync(resolvedPath, { recursive: true, force: true })` nên nó xoá **toàn bộ thư mục gốc** — bao gồm temp dir của các instance khác đang chạy song song.

## Câu hỏi làm rõ

- Có instance nào khác ngoài `BROWSER_RUNNING_DIR` cần unmap không? → Không. `AdapterDataManager` chỉ quản lý `instanceTempDir` (con của `BROWSER_RUNNING_DIR/profile/`). Không có thư mục nào khác cần xoá riêng.

- `dispose()` đã có sẵn và hoạt động đúng chưa? → Có. `dispose()` gọi `unmap(this.instanceTempDir)` — chỉ xoá temp dir của instance hiện tại.

## Các phương án

### Phương án 1: Dùng `dispose()` thay vì `unmap(BROWSER_RUNNING_DIR)`

Đổi dòng 211 từ `this.dataManager.unmap(BROWSER_RUNNING_DIR)` thành `this.dataManager.dispose()`.

- **Ưu điểm:**
  - Thay đổi tối thiểu (1 dòng).
  - `dispose()` semantic đã đúng: "dọn dẹp instance này".
  - Không ảnh hưởng instance khác.
- **Nhược điểm:** Không có.

### Phương án 2: Sửa `unmap()` thêm guard

Thêm guard vào `unmap()` để kiểm tra đường dẫn có nằm ngoài phạm vi `instanceTempDir` hay không.

- **Ưu điểm:** Phòng trường hợp gọi `unmap()` sai ở nơi khác.
- **Nhược điểm:**
  - Over-engineering cho bug 1 dòng.
  - Thay đổi nhiều file hơn.
  - Có thể gây conflict nếu cần unmap đường dẫn khác sau này.

### Phương án 3: Sửa `quit()` dùng `unmap(this.dataManager['instanceTempDir'])`

Truy cập private field `instanceTempDir` qua bracket notation.

- **Ưu điểm:** Rõ ràng về mặt ngữ nghĩa.
- **Nhược điểm:** Dùng bracket notation để truy cập private field là bad practice. Nếu TypeScript compiler có strict checks, có thể gây warning.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (dùng `dispose()`).
- **Phương án được chọn:** (do người duyệt điền sau)
- **Lý do:** Thay đổi tối thiểu, tận dụng method `dispose()` đã viết đúng sẵn.
- **Ràng buộc hoặc điều kiện kèm theo (nếu có):** Không.
