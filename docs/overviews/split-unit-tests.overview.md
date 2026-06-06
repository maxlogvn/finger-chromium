# Overview: Chia tách Unit Tests Core thành nhiều file

> **Version:** 1.0 | **Người thực hiện:** AI Agent | **Người kiểm tra:** (cho sau review) | **Ngày hoàn thành:** 2026-06-06

## Tom tắt

Đã chia file `tests/unit/core.spec.ts` (30 tests, 323 dòng) thành 3 file riêng theo module:
`errors.spec.ts` (12 tests), `exports.spec.ts` (6 tests), `config.spec.ts` (12 tests).
Tổng số tests không thay đổi (30). Tất cả quality gates pass.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| Bước 1: Tạo `errors.spec.ts` | — | OK | 0% |
| Bước 2: Tạo `exports.spec.ts` | — | OK | 0% |
| Bước 3: Tạo `config.spec.ts` | — | OK | 0% |
| Bước 4: Xoá `core.spec.ts` | — | OK | 0% |
| Bước 5: lint + typecheck + test | Pass | Pass | 0% |

## Sai lệch đáng chú ý

- **Phát hiện:** Issue cũ ghi "31 tests" nhưng thực tế file gốc chỉ có 30 tests.
  Không ảnh hưởng đến kết quả.

## Metric thành công

| Metric | Mục tiêu | Kết quả |
|--------|----------|---------|
| Số file test trong `tests/unit/` | 3 | 3 |
| Tổng số tests unit | 30 | 30 (không đổi) |
| `npm run lint` | Pass | Pass |
| `npm run typecheck` | Pass | Pass |
| `npm test` | Pass | 30 passing |

## Bài học kinh nghiệm

- Cần verify số test thực tế trước khi ghi nhận trong issue, tránh sai lệch số liệu.

## Tài liệu liên quan đã tạo/cập nhật

- `docs/designs/split-unit-tests.design.md` (tạo mới)
- `docs/specs/split-unit-tests.spec.md` (tạo mới)
- `docs/plans/split-unit-tests.plan.md` (tạo mới)
- `docs/issues/split-unit-tests.md` (cập nhật)
- `tests/unit/errors.spec.ts` (tạo mới)
- `tests/unit/exports.spec.ts` (tạo mới)
- `tests/unit/config.spec.ts` (tạo mới)
- `tests/unit/core.spec.ts` (xoá)

## Ghi chú cho các task tiếp theo

- Task "Chia tách Smoke Tests E2E" có thể tham khảo cách làm tương tự.
