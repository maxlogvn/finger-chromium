# Overview: Bug #2 — Error classes không export trong public API

## Tóm tắt

Đã thêm re-export cho 5 error class (`PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`) từ `src/plugin/errors.ts` qua `src/index.ts`. Người dùng giờ có thể `import { PluginError } from 'fingerprint-chromium-engine'`.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Code | Thêm export block vào src/index.ts | Đã thêm | Không có |
| Bước 2: Kiểm tra | lint, build, test pass | 0 errors, build success, 20/20 test pass | Không có |
| Bước 3: Rà soát tài liệu | Cập nhật product doc | Đã cập nhật error-hierarchy.product.md | Không có |
| Bước 4: Viết overview | Viết overview | Đã viết | Không có |
| Bước 5: Cập nhật Roadmap | Đánh dấu Hoàn thành | Chưa — chờ duyệt overview | — |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-002-export-error-classes.design.md`
- `docs/specs/bug-002-export-error-classes.spec.md`
- `docs/plans/bug-002-export-error-classes.plan.md`
- `docs/overviews/bug-002-export-error-classes.overview.md`
- `docs/products/error-hierarchy.product.md` (đã cập nhật)

## Ghi chú

Không có.
