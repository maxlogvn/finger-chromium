# Overview: Bug #3 — `quit()` xoá toàn bộ `BROWSER_RUNNING_DIR`

## Tóm tắt

Đã fix bug khiến `quit()` xoá toàn bộ thư mục gốc `.tmp/browser/running/` thay vì chỉ xoá thư mục tạm của instance hiện tại. Nguyên nhân: `quit()` gọi `this.dataManager.unmap(BROWSER_RUNNING_DIR)` — xoá cả thư mục gốc dùng chung. Fix: đổi thành `this.dataManager.dispose()` — method có sẵn chỉ xoá `instanceTempDir` của instance đó.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Code — sửa 1 dòng | `unmap(BROWSER_RUNNING_DIR)` → `dispose()` | Đã sửa đúng 1 dòng | Không có |
| Bước 2: Kiểm tra | lint, typecheck, build, test pass | Lint 0 errors, build thành công, 20/20 test pass (`typecheck` script không tồn tại trong package.json) | `typecheck` script không có — không chạy được, nhưng không phải lỗi do bug này |
| Bước 3: Rà soát tài liệu | Cập nhật design, spec, product docs | Đã cập nhật 3 file: `browser-engine.design.md`, `browser-engine.spec.md`, `browser-engine.product.md` + `KNOWN_ISSUES.md` | Không có |
| Bước 4: Viết overview | Viết overview | Đã viết | Không có |
| Bước 5: Cập nhật Roadmap | Đánh dấu Hoàn thành | Chưa — chờ duyệt overview | — |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-003-quit-unmap-root.design.md`
- `docs/specs/bug-003-quit-unmap-root.spec.md`
- `docs/plans/bug-003-quit-unmap-root.plan.md`
- `docs/overviews/bug-003-quit-unmap-root.overview.md`
- Các file đã cập nhật ở bước rà soát: `docs/designs/browser-engine.design.md`, `docs/specs/browser-engine.spec.md`, `docs/products/browser-engine.product.md`, `docs/KNOWN_ISSUES.md`

## Ghi chú

- `typecheck` script cần được thêm vào `package.json` nếu muốn dùng.
- Bug rất nhỏ (1 dòng), nhưng gây hậu quả nghiêm trọng (xoá toàn bộ temp dir của các instance khác).
