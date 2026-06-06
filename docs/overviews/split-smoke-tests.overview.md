# Overview: Chia tách Smoke Tests E2E

> **Version:** 1.0 | **Người thực hiện:** AI | **Người kiểm tra:** chờ duyệt | **Ngày hoàn thành:** 2026-06-06

## Tóm tắt

Đã tách `tests/smoke/browser-engine.spec.ts` (129 dòng) thành 4 file riêng theo từng nhóm test. Tất cả các bước trong plan hoàn thành đúng kế hoạch, không có sai lệch.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| Tạo `minimal-flow.spec.ts` | 1 bước | 1 bước | 0% |
| Tạo `fluent-api.spec.ts` | 1 bước | 1 bước | 0% |
| Tạo `error-handling.spec.ts` | 1 bước | 1 bước | 0% |
| Tạo `new-fingerprint.spec.ts` | 1 bước | 1 bước | 0% |
| Xoá file gốc | 1 bước | 1 bước | 0% |
| Kiểm tra (lint, typecheck, test) | Pass | Pass | 0% |

## Metric thành công

| Metric | Mục tiêu | Kết quả |
|--------|----------|---------|
| Chạy độc lập từng file | 4 file chạy riêng được | 4 file đều có thể `npx mocha --file` |
| `npm test` pass | Pass | 30 tests pass, smoke test skip (do thiếu key) |
| Lint + typecheck pass | Pass | Pass |
| Tổng dòng <= 142 | <= 142 dòng | 128 dòng (4 file) |

## Tài liệu liên quan đã tạo/cập nhật

- `docs/issues/split-smoke-tests.md` (viết lại chi tiết)
- `docs/designs/split-smoke-tests.design.md` (tạo mới)
- `docs/specs/split-smoke-tests.spec.md` (tạo mới)
- `docs/plans/split-smoke-tests.plan.md` (tạo mới)
- `tests/smoke/minimal-flow.spec.ts` (tạo mới)
- `tests/smoke/fluent-api.spec.ts` (tạo mới)
- `tests/smoke/error-handling.spec.ts` (tạo mới)
- `tests/smoke/new-fingerprint.spec.ts` (tạo mới)
- `tests/smoke/browser-engine.spec.ts` (xoá)

## Ghi chú cho các task tiếp theo

- Khi thêm smoke test mới, tạo file riêng trong `tests/smoke/` thay vì gộp chung.
- Mỗi file smoke test cần guard `skipTestIfNoKey()` ở đầu describe.
