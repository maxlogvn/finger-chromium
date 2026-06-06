# Overview: Smoke Test E2E cho BrowserEngine

> **Version:** 1.0 | **Người thực hiện:** AI | **Người kiểm tra:** (chờ duyệt) | **Ngày hoàn thành:** 2026-06-06

## Tóm tắt

Đã triển khai smoke test E2E cho `BrowserEngine` (Fluent API) tại `tests/smoke/browser-engine.spec.ts`. Test bao gồm lifecycle cơ bản, fluent API chain, xử lý lỗi và gọi fingerprint từ service. Đã thêm `MOCK_FINGERPRINT_DATA` vào `tests/helpers.ts`. Tất cả các bước trong plan hoàn thành, verify pass (lint, typecheck, build, test).

## Kết quả thực hiện

| Bước | Nội dung | Thực tế | Sai lệch |
|------|----------|---------|----------|
| 1 | Thêm `MOCK_FINGERPRINT_DATA` vào helpers.ts | Hoàn thành | 0% |
| 2 | Scaffolding file spec | Hoàn thành | 0% |
| 3 | Minimal Flow (2 tests) | Hoàn thành | 0% |
| 4 | Fluent API (1 test) | Hoàn thành | 0% |
| 5 | Error Handling (4 tests) | Hoàn thành | 0% |
| 6 | newFingerprint (1 test) | Hoàn thành | 0% |

## Sai lệch đáng chú ý

Không có sai lệch so với plan.

## Metric thành công

| Metric | Kết quả |
|--------|---------|
| `npm run lint` | Pass (0 errors) |
| `npm run typecheck` | Pass (0 errors) |
| `npm run build` | Pass (ESM + CJS + DTS) |
| `npm test` (không key) | 30 test pass + 8 smoke test skipped (đúng) |
| Script smoke test | 8 test cases trong 4 nhóm |

## Bài học kinh nghiệm

- `withEngine` không tự động launch -- callback phải gọi `engine.launch()` riêng.
- `createEngine` cần `try/finally` với `engine.quit()` cho error handling test (vì error test cần kiểm soát lifecycle chính xác).
- `skipTestIfNoKey()` hoạt động đúng: skip toàn bộ describe block khi thiếu key, không ảnh hưởng đến unit test khác.

## Tài liệu liên quan đã tạo/cập nhật

- `docs/issues/test-smoke-browser-engine.md` (cập nhật)
- `docs/designs/test-smoke-engine.design.md` (tạo mới)
- `docs/specs/test-smoke-engine.spec.md` (tạo mới)
- `docs/plans/test-smoke-engine.plan.md` (tạo mới)
- `docs/products/test-smoke-engine.product.md` (tạo mới)
- `tests/helpers.ts` (cập nhật -- thêm `MOCK_FINGERPRINT_DATA`)
- `tests/smoke/browser-engine.spec.ts` (tạo mới)

## Ghi chú cho các task tiếp theo

- Muốn chạy smoke test: set `BABLOSOFT_KEY` trước khi chạy `npm test`.
- Smoke test hiện tại skip nếu thiếu key -- không ảnh hưởng đến CI pipeline khi chưa có key.
- Khi viết integration test sâu hơn (CDP verify, proxy thật, profile thật), tham khảo pattern trong file này.
