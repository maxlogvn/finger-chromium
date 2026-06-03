# Overview: Bug #8 — Engine download URL dùng HTTP không an toàn

## Tóm tắt

Đã chuyển engine download URL từ HTTP sang HTTPS với cơ chế fallback về HTTP nếu HTTPS thất bại. Thêm helper `fetchWithFallback()` wrapper axios request, áp dụng cho cả metadata fetch và engine binary download.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Step 1: Thêm helper `fetchWithFallback` | Viết wrapper axios thử HTTPS trước, fallback HTTP | Đã thêm sau hàm `download()` | Không có |
| Step 2: Đổi metadata URL | `http://` → `https://` | Đã đổi tại URL fetch metadata | Không có |
| Step 3: Dùng `fetchWithFallback` cho metadata | Thay `axios.get()` bằng `fetchWithFallback()` | Đã thay | Không có |
| Step 4: Dùng `fetchWithFallback` cho download | Thay `axios.get()` bằng `fetchWithFallback()` | Phải giữ `axios.get()` với try/catch fallback riêng vì type `responseType: 'stream'` không tương thích với generic type | Có — xem bên dưới |
| Step 5: Lint + typecheck | Pass | Pass (chỉ còn pre-existing errors) | Không có |
| Step 6: Build | tsup bundle | Pass | Không có |

## Sai lệch đáng chú ý

- **Sai lệch 1:** `download()` không dùng `fetchWithFallback()` như plan mà dùng `axios.get()` riêng với try/catch fallback.
    - Nguyên nhân: `fetchWithFallback()` generic type `T` mặc định là `unknown` — khi dùng với `responseType: 'stream'`, `response.data` bị gán type `unknown`, không pass được vào `pipeline()`.
    - Hướng xử lý đã áp dụng: Giữ nguyên logic HTTPS trước → fallback HTTP, nhưng dùng `axios.get()` trực tiếp trong `download()` thay vì qua `fetchWithFallback()`.
    - Ảnh hưởng đến spec/plan: Không cần cập nhật — logic fallback vẫn hoạt động như design.

## Tài liệu liên quan

- `docs/designs/bug-008-https-fallback.design.md`
- `docs/specs/bug-008-https-fallback.spec.md`
- `docs/plans/bug-008-https-fallback.plan.md`
- `docs/KNOWN_ISSUES.md` (đã cập nhật)
- `src/plugin/connector/engine.ts` (đã sửa)

## Ghi chú

- `fetchWithFallback()` helper dùng được cho mọi request JSON, không dùng được cho stream response.
- Nếu sau này cần HTTPS fallback cho stream download, nên tách riêng helper hoặc dùng axios interceptor.
