# Plan: Chia tách Smoke Tests E2E

> **Version:** 1.0 | **Ngày bắt đầu dự kiến:** 2026-06-06 | **Ngày kết thúc dự kiến:** 2026-06-06

## Các bước thực hiện

- [ ] **Bước 1: Tạo `tests/smoke/minimal-flow.spec.ts`**
  - **Làm gì:** Copy `describe('Minimal Flow', ...)` từ file gốc (dòng 25-42) thành file riêng.
  - **File liên quan:** `tests/smoke/minimal-flow.spec.ts` (mới).
  - **DoD:** File có guard `skipTestIfNoKey()`, import `assert` + `withEngine`, chạy riêng được với `npx mocha --file tests/smoke/minimal-flow.spec.ts`.
  - **Rủi ro:** Không.

- [ ] **Bước 2: Tạo `tests/smoke/fluent-api.spec.ts`**
  - **Làm gì:** Copy `describe('Fluent API', ...)` từ file gốc (dòng 46-65) thành file riêng.
  - **File liên quan:** `tests/smoke/fluent-api.spec.ts` (mới).
  - **DoD:** File có guard + đủ imports (`assert`, `fs`, `path`, `os`, `withEngine`, mock constants), chạy riêng được.
  - **Rủi ro:** Không.

- [ ] **Bước 3: Tạo `tests/smoke/error-handling.spec.ts`**
  - **Làm gì:** Copy `describe('Error Handling', ...)` từ file gốc (dòng 69-115) thành file riêng.
  - **File liên quan:** `tests/smoke/error-handling.spec.ts` (mới).
  - **DoD:** File có guard + import `assert`, `PluginError`, `createEngine`, chạy riêng được.
  - **Rủi ro:** Không.

- [ ] **Bước 4: Tạo `tests/smoke/new-fingerprint.spec.ts`**
  - **Làm gì:** Copy `describe('newFingerprint', ...)` từ file gốc (dòng 119-128) thành file riêng.
  - **File liên quan:** `tests/smoke/new-fingerprint.spec.ts` (mới).
  - **DoD:** File có guard + import `assert`, `withEngine`, chạy riêng được.
  - **Rủi ro:** Không.

- [ ] **Bước 5: Xoá file gốc `tests/smoke/browser-engine.spec.ts`**
  - **Làm gì:** Dùng `git rm tests/smoke/browser-engine.spec.ts` để xoá.
  - **File liên quan:** `tests/smoke/browser-engine.spec.ts` (xoá).
  - **DoD:** File không còn trong working tree.
  - **Rủi ro:** Không.

- [ ] **Bước 6: Chạy kiểm tra**
  - **Làm gì:** `npm run lint`, `npm run typecheck`, `npm test`.
  - **DoD:** Cả 3 lệnh pass, smoke test vẫn chạy đúng 8 tests.
  - **Rủi ro:** Nếu typecheck lỗi, kiểm tra import ở từng file.

- [ ] **Bước 7: Commit**
  - **Làm gì:** Git commit với message tiếng Việt có dấu.
  - **DoD:** Commit đã push lên nhánh `split-smoke-tests`.

## Kiểm tra tổng thể

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npx mocha --file tests/smoke/minimal-flow.spec.ts` (chạy riêng từng file)
- `npx mocha --file tests/smoke/fluent-api.spec.ts`
- `npx mocha --file tests/smoke/error-handling.spec.ts`
- `npx mocha --file tests/smoke/new-fingerprint.spec.ts`

## Rủi ro & phương án dự phòng

- **Rủi ro:** Import thiếu hoặc sai → **Dự phòng:** TypeScript type check sẽ phát hiện, sửa lại import.
- **Rủi ro:** `skipTestIfNoKey()` viết sai chỗ → **Dự phòng:** Ngay sau `describe(function() {` phải có guard, dùng `function` keyword (không arrow).

## Ghi chú bổ sung

- Không cần cập nhật `CONVENTIONS.md`, `STACK.md`, hay `Welcome.md`.
- Sau commit, cần cập nhật `TRACKING.md` và viết overview.
