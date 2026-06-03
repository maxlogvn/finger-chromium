# Overview: Bug #4 — JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại

## Tóm tắt

Đã sửa JSDoc của interface `PWChromium` — xoá tham chiếu `usePrivateKey()` (method không tồn tại), thay bằng hướng dẫn set biến môi trường `BABLOSOFT_KEY`. Example code cũng được cập nhật tương ứng.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Code | Sửa JSDoc PWChromium.ts | Đã sửa dòng 17 và 25 | Không có |
| Bước 2: Kiểm tra | lint, build pass | 0 errors, build thành công | Không có |
| Bước 3: Viết overview | Viết overview | Đã viết | Không có |
| Bước 4: Cập nhật Roadmap | Đánh dấu Hoàn thành | Chưa — chờ duyệt overview | — |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-004-jsdoc-privatekey.design.md`
- `docs/specs/bug-004-jsdoc-privatekey.spec.md`
- `docs/plans/bug-004-jsdoc-privatekey.plan.md`
- `docs/overviews/bug-004-jsdoc-privatekey.overview.md`
- `docs/KNOWN_ISSUES.md` (đã cập nhật)

## Ghi chú

- Không thêm code mới, chỉ sửa comment JSDoc.
