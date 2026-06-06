# Overview: Cho phép Smoke Tests chạy không cần BABLOSOFT_KEY

> **Version:** 1.0 | **Ngày hoàn thành:** 2026-06-06

## Tóm tắt

Đã sửa `createEngine()` để không throw `MissingKeyError` khi thiếu key — engine tạo instance với key rỗng, dùng fingerprint free. Thêm `skipIfNoPremiumKey()` cho test cần premium. Cập nhật 4 smoke test files: 3 file bỏ skip hoàn toàn, 1 file chuyển sang `skipIfNoPremiumKey()`. Pass lint, typecheck, build.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch | Nguyên nhân |
|------|----------|---------|----------|-------------|
| Sửa `createEngine()` | 1 bước | 1 bước | 0% | Không |
| Thêm `skipIfNoPremiumKey()` | 1 bước | 1 bước | 0% | Không |
| Cập nhật 4 smoke test | 4 bước | 4 bước | 0% | Không |
| Kiểm tra lint/typecheck/build | Pass | Pass | 0% | Không |

## Metric thành công

| Metric | Mục tiêu | Kết quả |
|--------|----------|---------|
| `npm run lint` | Pass | Pass |
| `npm run typecheck` | Pass | Pass |
| `npm run build` | Pass | Pass |
| `createEngine()` không key | Không throw | Không throw |
| Smoke test free fingerprint | Chạy được | Chạy được (cần browser installed) |

## Tài liệu liên quan

- `docs/issues/smoke-test-key-requirement.md` (có sẵn)
- `docs/specs/smoke-test-key-requirement.spec.md` (tạo mới)
- `docs/plans/smoke-test-key-requirement.plan.md` (tạo mới)
- `tests/helpers.ts` (cập nhật)
- `tests/smoke/minimal-flow.spec.ts` (cập nhật)
- `tests/smoke/fluent-api.spec.ts` (cập nhật)
- `tests/smoke/error-handling.spec.ts` (cập nhật)
- `tests/smoke/new-fingerprint.spec.ts` (cập nhật)
