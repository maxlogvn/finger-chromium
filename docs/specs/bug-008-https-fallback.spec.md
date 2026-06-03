# Spec: Bug #8 — Engine download URL dùng HTTP không an toàn

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Đổi URL fetch metadata và download engine binary từ `http://` sang `https://` với cơ chế fallback về HTTP nếu HTTPS thất bại. Ngăn MITM tấn công khi tải engine từ bablosoft.

## Yêu cầu

- Metadata URL mặc định phải dùng `https://`.
- Download URL (lấy từ metadata) phải được upgrade lên `https://` trước khi gọi.
- Nếu request HTTPS thất bại (network error), tự động fallback về HTTP.
- Chỉ throw error khi cả HTTPS và HTTP đều thất bại.
- Debug log khi fallback xảy ra.

## Thiết kế

Tham chiếu: `docs/designs/bug-008-https-fallback.design.md`

Thêm helper `fetchWithFallback` để wrapper axios request với cơ chế:
1. Upgrade URL scheme lên HTTPS.
2. Thử request.
3. Nếu lỗi network/HTTP, đổi scheme về HTTP và thử lại.
4. Trả về kết quả từ lần đầu thành công, hoặc throw nếu cả hai đều fail.

## Data flow

- `#updateMeta()`: gọi `fetchWithFallback(httpsUrl)` → parse JSON → lưu `data.Url`.
- Download engine: nhận `data.Url` (HTTP), upgrade thành `https://`, gọi `fetchWithFallback(httpsUrl)` → stream vào file zip.

## Components

- `src/plugin/connector/engine.ts` (sửa):
  - Thêm helper `fetchWithFallback(url)`.
  - Đổi metadata URL từ `http://` → `https://`.
  - Upgrade download URL từ metadata lên HTTPS trước khi dùng.

## Xử lý lỗi

- HTTPS fail, HTTP success → OK, log debug.
- HTTPS + HTTP đều fail → throw error gốc (message từ lần cuối cùng).
- Lỗi 404/500 (non-network) → không fallback, throw luôn.

## Kiểm tra

- Happy path: metadata fetch và download thành công qua HTTPS.
- Fallback path: HTTPS fail (simulate network error), HTTP success.
- Error path: cả hai đều fail → throw đúng error.
