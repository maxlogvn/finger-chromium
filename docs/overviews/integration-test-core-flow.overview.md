# Overview: Integration Tests cho Core Flow

> **Version:** 1.0 | **Người thực hiện:** AI Agent | **Người kiểm tra:** ... | **Ngày hoàn thành:** 2026-06-06

## Tóm tắt

Đã triển khai integration test cho core flow (`launch -> newContext -> quit`) với mock connector + mock launcher. Test chạy ~180ms, không cần `BABLOSOFT_KEY`, không cần engine binary. Kèm theo thay đổi DI nhỏ ở 3 file production để hỗ trợ inject mock connector.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch | Nguyên nhân |
|------|----------|---------|----------|-------------|
| DI: FingerprintPlugin + connector param | 5 phút | 5 phút | 0% | Không |
| DI: PlaywrightFingerprintPlugin pass connector | 5 phút | 5 phút | 0% | Không |
| DI: BrowserEngine pass connector | 5 phút | 5 phút | 0% | Không |
| MockConnector + helpers | 10 phút | 10 phút | 0% | Không |
| Integration test | 10 phút | 15 phút | +50% | Fix lỗi mock context thiếu `newPage` gây Proxy crash |
| typecheck + lint | 2 phút | 2 phút | 0% | Không |
| npm test (integration) | 2 phút | 1 phút | -50% | Nhanh hơn dự kiến |
| Commit | 1 phút | 1 phút | 0% | Không |

## Sai lệch đáng chú ý

- **Bước 5 (Integration test):** Chậm hơn 5 phút so với kế hoạch.
  - **Nguyên nhân:** `bindHooks()` trong `utils.ts` gọi `new Proxy(ctx.newPage, ...)` mà mock context không có `newPage` method, gây `TypeError: Cannot create proxy with a non-object`.
  - **Hướng xử lý đã áp dụng:** Thêm `newPage: async () => ({})` vào mock context object.
  - **Ảnh hưởng đến plan/spec:** Không cần cập nhật -- vấn đề là runtime, không phải thiết kế.

## Metric thành công

| Metric | Kết quả |
|--------|---------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| Integration test (2 tests) | Pass (~180ms) |
| Không cần `BABLOSOFT_KEY` | Đúng |
| Không cần engine binary | Đúng |

## Bài học kinh nghiệm

- Khi mock Playwright `BrowserContext`, cần đảm bảo có đủ các method mà `bindHooks` và `configure` sử dụng (đặc biệt là `newPage`, `once`, `pages`, `close`).
- `Proxy(target, handler)` trong JavaScript yêu cầu `target` là object -- `undefined` hoặc `null` gây `TypeError`.
- Connection DI là pattern hiệu quả: chỉ cần thêm 1 tham số optional, không ảnh hưởng API hiện tại.

## Tài liệu liên quan đã tạo/cập nhật

- `src/plugin/index.ts` (cập nhật)
- `src/adapter/playwright/bridge.ts` (cập nhật)
- `src/adapter/playwright/fluent.ts` (cập nhật)
- `tests/integration/helpers.ts` (tạo mới)
- `tests/integration/core-flow.spec.ts` (tạo mới)
- `docs/designs/integration-test-coverage.design.md` (tạo mới)
- `docs/plans/integration-test-core-flow.plan.md` (tạo mới)
- `docs/products/integration-test-core-flow.product.md` (tạo mới)
- `docs/TRACKING.md` (cập nhật)

## Ghi chú cho các task tiếp theo

- Có thể mở rộng integration test với error scenarios (setup API fail, timeout) bằng cách override `MockConnector.api()`.
- Nếu cần test luồng `fetch()` và `versions()`, `MockConnector` đã hỗ trợ sẵn response mặc định.
