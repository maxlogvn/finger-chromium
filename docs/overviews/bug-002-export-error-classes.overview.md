# Overview: Bug #2 — Error classes không export trong public API

## Tóm tắt

Đã thêm re-export cho 5 error class (`PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`) từ `src/plugin/errors.ts` qua `src/index.ts`. Người dùng giờ có thể `import { PluginError } from 'fingerprint-chromium-engine'`.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Code | Them export block vao src/index.ts | Da them | Khong co |
| Bước 2: Kiem tra | lint, build, test pass | 0 errors, build success, 20/20 test pass | Khong co |
| Bước 3: Ra soat tai lieu | Cap nhat product doc | Da cap nhat error-hierarchy.product.md | Khong co |
| Bước 4: Viet overview | Viet overview | Da viet | Khong co |
| Bước 5: Cap nhat Roadmap | Danh dau Hoan thanh | Chua — cho duyet overview | — |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-002-export-error-classes.design.md`
- `docs/specs/bug-002-export-error-classes.spec.md`
- `docs/plans/bug-002-export-error-classes.plan.md`
- `docs/overviews/bug-002-export-error-classes.overview.md`
- `docs/products/error-hierarchy.product.md` (da cap nhat)

## Ghi chú

Khong co.
