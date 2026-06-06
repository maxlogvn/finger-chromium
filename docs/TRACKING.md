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

**Viết Integration Tests cho Core Flow** | feature
Xây dựng integration test cho toàn bộ core flow (launch → newContext → quit) với `RemoteEngine` được mock, không cần BABLOSOFT_KEY.
Tách riêng thư mục `tests/integration/`, file `core-flow.spec.ts`.
Các bước:
- Design: kiến trúc mock cho `RemoteEngine` + `Connector`
- Spec: test cases chi tiết (thành công, lỗi, edge cases)
- Plan: triển khai từng bước
- Code: mock layer + test file
- Chạy được: `npm test` không cần key, pass trong CI
- **Nhánh:** `integration-test-core-flow`
- **Bước hiện tại:** Code xong — chờ tài liệu + review
- **Tài liệu:** [Issue](docs/issues/integration-test-coverage.md) / [Design](docs/designs/integration-test-coverage.design.md) / [Plan](docs/plans/integration-test-core-flow.plan.md)

---

## Đã hoàn thành

**Cho phép Smoke Tests chạy không cần BABLOSOFT_KEY** | issue
Engine binary chấp nhận key rỗng cho fingerprint miễn phí (Windows). `createEngine()` trong `tests/helpers.ts` throw `MissingKeyError` quá sớm, ngăn smoke test chạy browser thật dù không cần key.
Fix: sửa `createEngine()` không throw khi thiếu key, cho phép smoke test launch browser thật với fingerprint free.
- **Nhánh:** `fix/smoke-test-key-requirement`
- **Bước hiện tại:** Hoàn thành
- **Tài liệu:** [Issue](docs/issues/smoke-test-key-requirement.md) / [Spec](docs/specs/smoke-test-key-requirement.spec.md) / [Plan](docs/plans/smoke-test-key-requirement.plan.md)
- **Overview:** [`docs/overviews/smoke-test-key-requirement.overview.md`](docs/overviews/smoke-test-key-requirement.overview.md)

---

**Chia tách Smoke Tests E2E** | issue
Chia `tests/smoke/browser-engine.spec.ts` thành 4 file riêng: `minimal-flow.spec.ts`, `fluent-api.spec.ts`, `error-handling.spec.ts`, `new-fingerprint.spec.ts`.
- **Nhánh:** `split-smoke-tests`
- **Bước hiện tại:** Hoàn thành
- **Tài liệu:** [Issue](docs/issues/split-smoke-tests.md) / [Design](docs/designs/split-smoke-tests.design.md) / [Spec](docs/specs/split-smoke-tests.spec.md) / [Plan](docs/plans/split-smoke-tests.plan.md)
- **Overview:** [`docs/overviews/split-smoke-tests.overview.md`](docs/overviews/split-smoke-tests.overview.md)

---

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

**Smoke Test E2E (`tests/smoke/browser-engine.spec.ts`)** | feature
8 smoke test cho BrowserEngine: minimal flow, fluent API, error handling, newFingerprint. Skip nếu thiếu key.
- **Nhánh:** `smoke-test-engine`
- **Bước hiện tại:** Hoàn thành
- **Tài liệu:** [Issue](docs/issues/test-smoke-browser-engine.md) / [Design](docs/designs/test-smoke-engine.design.md) / [Spec](docs/specs/test-smoke-engine.spec.md) / [Plan](docs/plans/test-smoke-engine.plan.md)
- **Overview:** [`docs/overviews/test-smoke-engine.overview.md`](docs/overviews/test-smoke-engine.overview.md)
- **Product:** [`docs/products/test-smoke-engine.product.md`](docs/products/test-smoke-engine.product.md)

---
