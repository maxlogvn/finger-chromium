# Spec: Chia tách Unit Tests Core thành nhiều file

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).
> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả

Chia file `tests/unit/core.spec.ts` (323 dòng, 31 tests) thành 3 file riêng theo module:
`errors.spec.ts`, `exports.spec.ts`, `config.spec.ts`. Mỗi file chỉ chứa tests
và imports cần thiết cho module tương ứng. Không thay đổi nội dung hay số lượng test.

## Phạm vi

- **Trong phạm vi:** Tách file, sắp xếp imports, đảm bảo tổng số test không thay đổi.
- **Ngoài phạm vi:** Thêm/sửa/xoá test case, thay đổi logic test, tạo setup helper chung.

## Yêu cầu

- **Functional:**
  - File `tests/unit/errors.spec.ts` chứa đúng 12 tests của section "Error classes".
  - File `tests/unit/exports.spec.ts` chứa đúng 6 tests của section "Public exports".
  - File `tests/unit/config.spec.ts` chứa đúng 13 tests của section "Config".
  - Mỗi file chỉ import các module cần thiết, không có import dư thừa.
  - `npm test` chạy thành công với tổng số test = 31.
  - TypeScript type check pass (`npm run typecheck`).
- **Non-functional:**
  - Không thay đổi cấu hình Mocha (`.mocharc.yml`).
  - Tuân thủ conventions: tên file `*.spec.ts`, export mặc định, không barrel export.

## Phụ thuộc

- File nguồn `tests/unit/core.spec.ts`.
- Các module nguồn: `src/plugin/errors.ts`, `src/adapter/playwright/fluent.ts`, `src/plugin/config.ts`, `src/plugin/launcher.ts`.

## Thiết kế

Tham chiếu design doc: `docs/designs/split-unit-tests.design.md`

Cấu trúc file sau khi tách:

```
tests/unit/
  core.spec.ts        ← xoá sau khi tách
  errors.spec.ts      ← 12 tests — error class behavior
  exports.spec.ts     ← 6 tests — public export sanity checks
  config.spec.ts      ← 13 tests — getValidPollInterval, ConfigManager
```

## API / Data flow

Không có API thay đổi. Đây là refactor test thuần tuý.

- **Input:** File `core.spec.ts` cũ.
- **Output:** 3 file spec mới, `core.spec.ts` được xoá.
- **Luồng dữ liệu:** Mocha đọc pattern `tests/**/*.ts`, tự động phát hiện 3 file mới.
  Không cần thay đổi cấu hình.

## Components

### `tests/unit/errors.spec.ts` (tạo mới)

- **Import:** `assert` từ `node:assert`, 5 error classes từ `../../src/plugin/errors`.
- **Nội dung:** 5 describe blocks, 12 tests — y hệt section "Error classes" từ `core.spec.ts` (dòng 23–103).

### `tests/unit/exports.spec.ts` (tạo mới)

- **Import:** `assert` từ `node:assert`,
  5 error classes từ `../../src/plugin/errors`,
  `BrowserEngine` từ `../../src/adapter/playwright/fluent`.
- **Nội dung:** 1 describe block, 6 tests — y hệt section "Public exports" từ `core.spec.ts` (dòng 105–135).

### `tests/unit/config.spec.ts` (tạo mới)

- **Import:** `assert` từ `node:assert`, `fs` từ `node:fs`, `path` từ `node:path`, `os` từ `node:os`,
  `getValidPollInterval`, `ConfigManager` từ `../../src/plugin/config`,
  type `Browser` từ `../../src/plugin/launcher`.
- **Nội dung:** 3 describe blocks, 13 tests — y hệt section "Config" từ `core.spec.ts` (dòng 137–323).

### `tests/unit/core.spec.ts` (xoá)

- Xoá sau khi 3 file mới đã được tạo và xác nhận chạy đúng.

## Xử lý lỗi

| Lỗi | Cách xử lý |
|---|---|
| Import sai path trong file mới | TypeScript type check sẽ báo lỗi — sửa path cho đúng |
| Test bị thiếu sau khi copy | So sánh tổng số test output — verify đúng 31 tests |
| File cũ `core.spec.ts` chưa xoá gây chạy test trùng | Xoá file sau khi verify |
| ESLint format sai | Chạy `npm run lint` và sửa |

## Kiểm tra (Testing)

- **Happy path:** `npm test` chạy thành công, output hiển thị đúng 31 tests (hoặc nhiều hơn nếu có test khác trong suite), tất cả pass.
- **Edge case:** `errors.spec.ts` chỉ chạy khi import đúng path — verify output có 12 tests từ file này.
- **Edge case:** `config.spec.ts` dùng `fs`, `os` — cần file system tạm, verify cleanup hoạt động.
- **Error case:** Nếu import sai, TypeScript báo lỗi — sửa trước khi chạy test.
