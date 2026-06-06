# Plan: Chia tách Unit Tests Core thành nhiều file

> **Version:** 1.0 | **Ngày bắt đầu dự kiến:** 2026-06-06 | **Ngày kết thúc dự kiến:** 2026-06-06

## Các bước thực hiện

- [ ] **Bước 1: Tạo `tests/unit/errors.spec.ts`**
  - **Làm gì:** Copy section "Error classes" (dòng 23–103) từ `core.spec.ts` sang file mới.
    Import chỉ gồm `assert` + 5 error classes từ `../../src/plugin/errors`.
    Giữ nguyên describe blocks, test cases, assertion.
  - **File liên quan:** `tests/unit/errors.spec.ts` (mới)
  - **Định nghĩa hoàn thành (DoD):** File tồn tại, import đúng, 12 tests.

- [ ] **Bước 2: Tạo `tests/unit/exports.spec.ts`**
  - **Làm gì:** Copy section "Public exports" (dòng 105–135) từ `core.spec.ts` sang file mới.
    Import gồm `assert`, 5 error classes từ `../../src/plugin/errors`,
    `BrowserEngine` từ `../../src/adapter/playwright/fluent`.
  - **File liên quan:** `tests/unit/exports.spec.ts` (mới)
  - **DoD:** File tồn tại, import đúng, 6 tests.

- [ ] **Bước 3: Tạo `tests/unit/config.spec.ts`**
  - **Làm gì:** Copy section "Config" (dòng 137–323) từ `core.spec.ts` sang file mới.
    Import gồm `assert`, `fs`, `path`, `os` từ `node:*`,
    `getValidPollInterval`, `ConfigManager` từ `../../src/plugin/config`,
    type `Browser` từ `../../src/plugin/launcher`.
  - **File liên quan:** `tests/unit/config.spec.ts` (mới)
  - **DoD:** File tồn tại, import đúng, 13 tests.

- [ ] **Bước 4: Xoá `tests/unit/core.spec.ts`**
  - **Làm gì:** Xoá file cũ sau khi đã verify 3 file mới chạy đúng.
  - **File liên quan:** `tests/unit/core.spec.ts` (xoá)
  - **DoD:** File không còn tồn tại.

- [ ] **Bước 5: Kiểm tra quality gates**
  - **Làm gì:** Chạy `npm run lint`, `npm run typecheck`, `npm test`.
    Verify tổng số test vẫn là 31 (hoặc tổng số test của toàn bộ suite
    không thay đổi so với trước khi tách).
  - **File liên quan:** — (chạy lệnh)
  - **DoD:** Tất cả pass, số test không thay đổi.

## Kiểm tra tổng thể

- `npm run lint`
- `npm run typecheck`
- `npm test` — verify output: `31 passing` (phần unit tests)

## Rủi ro & phương án dự phòng

- **Rủi ro:** Import sai path trong file mới → **Dự phòng:** TypeScript type check phát hiện ngay.
- **Rủi ro:** Test bị thiếu do copy thiếu → **Dự phòng:** So sánh output test count = 31.
- **Rủi ro:** `npm run lint` báo lỗi format → **Dự phòng:** Sửa format theo ESLint.

## Ghi chú bổ sung

- Không cần cập nhật `CONVENTIONS.md`, `STACK.md`, hay `Welcome.md`.
- Sau khi hoàn thành, sẽ cần viết overview doc (issue task — chỉ overview, không cần product).
