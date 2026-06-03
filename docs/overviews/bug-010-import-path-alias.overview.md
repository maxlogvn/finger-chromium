# Overview: Bug #10 — Import path alias `'src/types/fetch'` không khớp tsconfig

## Tóm tắt

Đã fix import `from 'src/types/fetch'` thành `from '../../types/fetch'` tại `src/adapter/playwright/chromium.ts:24`. Import cũ dùng absolute path không có alias tương ứng trong tsconfig.json (chỉ có `@src/*`), gây không resolve được ở một số môi trường.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Đổi import path trong `chromium.ts` | Sửa `'src/types/fetch'` → `'../../types/fetch'` | Đã sửa đúng | Không có |
| Bước 2: Chạy kiểm tra | `npm run lint` + `npm run typecheck` + `npm run build` | Lint pass, build success, type check pre-existing errors không liên quan | `typecheck` script không tồn tại — đã chạy `tsc --noEmit` thay thế |

## Sai lệch đáng chú ý

- **Thiếu script `typecheck`:** package.json không có `npm run typecheck`. Đã chạy `tsc --noEmit` trực tiếp để kiểm tra type. Kết quả: lỗi pre-existing ở `pcapServer/index.ts` không liên quan đến change.

## Tài liệu liên quan

- `docs/designs/bug-010-import-path-alias.design.md` — đã tạo
- `docs/specs/bug-010-import-path-alias.spec.md` — đã tạo
- `docs/plans/bug-010-import-path-alias.plan.md` — đã tạo
- `docs/KNOWN_ISSUES.md` — đã cập nhật, chuyển #10 từ OPEN sang FIXED

## Ghi chú

- Nên thêm script `typecheck` vào package.json để tiện kiểm tra sau này.
