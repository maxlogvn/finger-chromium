# Plan: Sửa tài liệu thiếu chi tiết

> Non-feature task: sửa 8 file tài liệu bị lệch template, thiếu section, thiếu file overview.

## Các bước thực hiện

- [x] Bước 1: Tạo `overviews/documentation-rewrite.overview.md` — file còn thiếu
    - Làm gì: Tạo overview cho task documentation-rewrite, dùng overview template chuẩn.
    - File liên quan: `docs/overviews/documentation-rewrite.overview.md`
    - Ghi chú: Nội dung dựa trên ROADMAP.md và plan hiện có.

- [x] Bước 2: Sửa `specs/mutex-path-resolution.spec.md` — thêm dòng tham chiếu CONVENTIONS
    - Làm gì: Thêm `> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).` ngay sau tiêu đề.
    - File liên quan: `docs/specs/mutex-path-resolution.spec.md`

- [x] Bước 3: Sửa `designs/mutex-path-resolution.design.md` — đúng tên section template
    - Làm gì: Đổi `## Vấn đề cần giải quyết` → `## Bối cảnh`. Đổi `## Các phương án đã cân nhắc` → `## Các phương án`. Thêm `## Câu hỏi làm rõ`.
    - File liên quan: `docs/designs/mutex-path-resolution.design.md`

- [x] Bước 4: Sửa `overviews/mutex-path-resolution.overview.md` — đúng template overview
    - Làm gì: Đổi `## Mục tiêu` → `## Tóm tắt`. Chuyển phần `## Kết quả` thành bảng `## Kết quả thực hiện`. Thêm `## Tài liệu liên quan`. Đổi `## Ghi chú kỹ thuật` → `## Ghi chú`.
    - File liên quan: `docs/overviews/mutex-path-resolution.overview.md`

- [x] Bước 5: Viết lại `specs/hook-binding.spec.md` — theo spec template chuẩn
    - Làm gì: Viết lại hoàn toàn, giữ nội dung hiện có (proxy chain flow, bảng functions, setViewport flow) nhưng phân bổ vào 7 section: Mô tả, Yêu cầu, Thiết kế, API/Data flow, Components, Xử lý lỗi, Kiểm tra.
    - File liên quan: `docs/specs/hook-binding.spec.md`
    - Phụ thuộc: Không.

- [x] Bước 6: Viết lại `overviews/hook-binding.overview.md` — theo overview template chuẩn
    - Làm gì: Đổi `## Mục tiêu` → `## Tóm tắt`. Chuyển `## Kết quả` thành bảng `## Kết quả thực hiện`. Thêm `## Tài liệu liên quan`. Thêm `## Ghi chú`. Giữ nội dung gốc (proxy chain notes).
    - File liên quan: `docs/overviews/hook-binding.overview.md`

- [x] Bước 7: Viết lại `products/hook-binding.product.md` — theo product template chuẩn
    - Làm gì: Đổi cấu trúc thành `## Mô tả`, `## Cách sử dụng`, `## Hành vi chi tiết`, `## Giới hạn và điều kiện`, `## Tài liệu kỹ thuật liên quan`. Giữ nội dung proxy chain, onClose, bindHooks.
    - File liên quan: `docs/products/hook-binding.product.md`

- [x] Bước 8: Sửa `ROADMAP.md` — bổ sung link còn thiếu
    - Làm gì: (a) Thêm `| [Overview](overviews/known-issues-separate.overview.md)` vào dòng known-issues-separate. (b) Kiểm tra consistency.
    - File liên quan: `docs/ROADMAP.md`

## Kiểm tra

- Các file `.md` cần đúng Markdown syntax (không có lệnh kiểm tra tự động riêng, dùng mắt kiểm tra).
- `npm run lint` — không có lỗi (chỉ kiểm tra code, không ảnh hưởng tài liệu).

## Ghi chú

- Không thay đổi nội dung kỹ thuật — chỉ reformat theo template và bổ sung section còn thiếu.
- Nội dung gốc (proxy chain flow, resolvePackageRoot algorithm, setViewport flow, technical notes) được giữ nguyên vẹn.
