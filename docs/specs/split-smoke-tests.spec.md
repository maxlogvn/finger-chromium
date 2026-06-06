# Spec: Chia tách Smoke Tests E2E

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).
> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả

Tách file `tests/smoke/browser-engine.spec.ts` (129 dòng) thành 4 file riêng, mỗi file chứa một nhóm test độc lập. Không thay đổi logic test, chỉ tái cấu trúc file.

## Phạm vi

- **Trong phạm vi:** Tách 4 describe block thành 4 file `*.spec.ts` riêng; xoá file gốc.
- **Ngoài phạm vi:** Thêm test mới, sửa logic test, thay đổi helpers, cấu hình Mocha, hoặc CI.

## Yêu cầu

- **Functional:**
  - `npx mocha --file tests/smoke/minimal-flow.spec.ts` chạy được độc lập.
  - `npx mocha --file tests/smoke/error-handling.spec.ts` chạy được độc lập.
  - `npx mocha --file tests/smoke/fluent-api.spec.ts` chạy được độc lập.
  - `npx mocha --file tests/smoke/new-fingerprint.spec.ts` chạy được độc lập.
  - `npm test` vẫn pass với cả 4 file (Mocha glob `tests/**/*.spec.ts` nhặt tự động).
  - Mỗi file có guard `skipTestIfNoKey()` ở đầu describe.
- **Non-functional:**
  - Tổng số dòng sau khi tách không vượt quá 10% so với tổng cũ (hiện 129 dòng, mục tiêu <= 142 dòng) — do import lặp lại ở mỗi file.

## Phụ thuộc

- `tests/helpers.ts` — cả 4 file đều import từ đây.
- `.mocharc.yml` ở root — đã dùng glob `tests/**/*.spec.ts`, không cần sửa.

## Thiết kế

Tham chiếu: `docs/designs/split-smoke-tests.design.md` (phương án 1: tách 4 file riêng, không barrel).

Cấu trúc sau khi tách:

```
tests/smoke/
  ├── minimal-flow.spec.ts       # 2 tests, ~25 dòng
  ├── fluent-api.spec.ts         # 1 test, ~27 dòng
  ├── error-handling.spec.ts     # 4 tests, ~54 dòng
  └── new-fingerprint.spec.ts    # 1 test, ~17 dòng
```

## API / Data flow

Không thay đổi API. Mỗi file giữ nguyên logic test như file gốc, chỉ việc copy `describe` block tương ứng vào file riêng, thêm imports cần thiết.

## Components

### File mới

| File | Nội dung gốc (dòng) | Import cần thêm |
|------|---------------------|-----------------|
| `tests/smoke/minimal-flow.spec.ts` | `describe('Minimal Flow', ...)` — dòng 25-42 | `assert`, `withEngine` |
| `tests/smoke/fluent-api.spec.ts` | `describe('Fluent API', ...)` — dòng 46-65 | `assert`, `fs`, `path`, `os`, `withEngine` + mock constants |
| `tests/smoke/error-handling.spec.ts` | `describe('Error Handling', ...)` — dòng 69-115 | `assert`, `PluginError`, `createEngine` |
| `tests/smoke/new-fingerprint.spec.ts` | `describe('newFingerprint', ...)` — dòng 119-128 | `assert`, `withEngine` |

### File xoá

- `tests/smoke/browser-engine.spec.ts` — xoá hoàn toàn (dùng `git rm`).

## Xử lý lỗi

| Lỗi | Cách xử lý |
|-----|-------------|
| Quên guard `skipTestIfNoKey()` | Check kỹ template — mỗi file phải có guard này ngay sau `describe(`. |
| Import thiếu | Dùng TypeScript compiler (`tsc --noEmit`) để phát hiện. |
| File cũ còn sót | Dùng `git rm` thay vì xoá thủ công. |

## Kiểm tra (Testing)

- **Happy path:** `npm test` pass, `npx mocha --file tests/smoke/minimal-flow.spec.ts` chạy riêng được.
- **Edge case:** File mới không có guard key → skip toàn bộ khi thiếu BABLOSOFT_KEY.
- **Verification:** `git diff --stat` hiển thị 4 file added, 1 file deleted.
