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

## Đang làm

*Không có.*

---

## Dự định làm

**Chia tách Smoke Tests E2E** | issue
Chia `tests/smoke/browser-engine.spec.ts` thành 4 file riêng: `minimal-flow.spec.ts`, `fluent-api.spec.ts`, `error-handling.spec.ts`, `new-fingerprint.spec.ts`.
- **Issue:** [`docs/issues/split-smoke-tests.md`](docs/issues/split-smoke-tests.md)

---

## Đã hoàn thành

**Chia tách Unit Tests Core** | issue
Chia `tests/unit/core.spec.ts` thành 3 file riêng: `errors.spec.ts`, `exports.spec.ts`, `config.spec.ts`.
- **Nhánh:** `split-unit-tests`
- **Bước hiện tại:** Hoàn thành
- **Tài liệu:** [Issue](docs/issues/split-unit-tests.md) / [Design](docs/designs/split-unit-tests.design.md) / [Spec](docs/specs/split-unit-tests.spec.md) / [Plan](docs/plans/split-unit-tests.plan.md)
- **Overview:** [`docs/overviews/split-unit-tests.overview.md`](docs/overviews/split-unit-tests.overview.md)

---

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

## Đã hoàn thành

**Smoke Test E2E (`tests/smoke/browser-engine.spec.ts`)** | feature
8 smoke test cho BrowserEngine: minimal flow, fluent API, error handling, newFingerprint. Skip nếu thiếu key.
- **Nhánh:** `smoke-test-engine`
- **Bước hiện tại:** Hoàn thành
- **Tài liệu:** [Issue](docs/issues/test-smoke-browser-engine.md) / [Design](docs/designs/test-smoke-engine.design.md) / [Spec](docs/specs/test-smoke-engine.spec.md) / [Plan](docs/plans/test-smoke-engine.plan.md)
- **Overview:** [`docs/overviews/test-smoke-engine.overview.md`](docs/overviews/test-smoke-engine.overview.md)
- **Product:** [`docs/products/test-smoke-engine.product.md`](docs/products/test-smoke-engine.product.md)

---
