# Tracking

> Theo dõi tiến độ feature và issue fix của dự án.

## Phân loại

### `feature`
Tính năng mới — thêm khả năng chưa từng có.
- **Dấu hiệu:** Người dùng không thể làm điều này trước đây.
- **Ví dụ:** "Hỗ trợ proxy rotation", "Tự động lưu profile real-time".

### `issue`
Vấn đề cần sửa — bug, cải thiện chất lượng, trả nợ kỹ thuật.
- **Dấu hiệu:** Đã có nhưng hoạt động sai, thiếu sót, hoặc khó bảo trì.
- **Ví dụ:** "Race condition khi cleanup", "Thiếu test coverage IPC core".

## Cấu trúc mục

### Dự định làm
`**<tên>** | feature` + Mô tả + Issue (nếu đã viết).

### Đang làm
Như Dự định làm, thêm **Nhánh** + **Bước hiện tại** + **Tài liệu** (Issue / Design / Spec / Plan — link đến file tương ứng, chỉ thêm khi đã tồn tại).

### Đã hoàn thành
Như Đang làm, thêm **Bước hiện tại: Hoàn thành** + link Overview (bắt buộc) + Product (nếu là feature).

---

## Đã hoàn thành

**Test Utilities (`tests/helpers.ts`)** | feature
Xây dựng file tiện ích dùng chung: `skipTestIfNoKey()`, `createEngine()`, `withEngine()`, constants mẫu.
- **Nhánh:** `rewrite-test`
- **Bước hiện tại:** Hoàn thành
- **Tài liệu:** [Issue](docs/issues/test-helpers.md) / [Design](docs/designs/test-helpers.design.md) / [Spec](docs/specs/test-helpers.spec.md) / [Plan](docs/plans/test-helpers.plan.md)
- **Overview:** [`docs/overviews/test-helpers.overview.md`](docs/overviews/test-helpers.overview.md)
- **Product:** [`docs/products/test-helpers.product.md`](docs/products/test-helpers.product.md)

---

**Unit Tests Core (`tests/unit/core.spec.ts`)** | feature
30 unit test cho 3 module core (errors, exports, config). Không cần BABLOSOFT_KEY.
- **Nhánh:** `unit-test-core`
- **Bước hiện tại:** Hoàn thành
- **Tài liệu:** [Issue](docs/issues/test-unit-core.md) / [Design](docs/designs/test-unit-core.design.md) / [Spec](docs/specs/test-unit-core.spec.md) / [Plan](docs/plans/test-unit-core.plan.md)
- **Overview:** [`docs/overviews/test-unit-core.overview.md`](docs/overviews/test-unit-core.overview.md)
- **Product:** [`docs/products/test-unit-core.product.md`](docs/products/test-unit-core.product.md)

---

## Dự định làm

**Smoke Test E2E (`tests/smoke/browser-engine.spec.ts`)** | feature
Test luồng chính BrowserEngine: minimal flow, full fluent API flow, error handling. Skip nếu thiếu key.
Issue: [`docs/issues/test-smoke-browser-engine.md`](docs/issues/test-smoke-browser-engine.md)

---
