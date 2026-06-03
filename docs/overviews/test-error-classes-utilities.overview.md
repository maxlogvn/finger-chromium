# Overview: Test Error classes & Utilities

## Tóm tắt

Đã viết unit test cho 4 module: `errors.ts`, `utils.ts`, `common/index.ts`, `loader/index.ts`. Tổng cộng 35 test cases, gộp trong file `tests/utils.test.ts`. Tất cả 58 test (35 mới + 23 cũ) đều pass.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Test Error classes (5 class) | 13 test: instanceof, name, toStringTag, message | Hoàn thành 13 test | Không có |
| Bước 2: Test defaultArgs() | 6 test: options mặc định, headless, extensions, IGNORED_ARGS | Hoàn thành 6 test | 1 test sai hiểu behavior của `headless` default (`!devtools` = true) -> đã sửa test cho đúng |
| Bước 3: Test getProfilePath() | 4 test: ưu tiên userDataDir, fallback, empty | Hoàn thành 4 test | Không có |
| Bước 4: Test validateConfig() + validateLauncher() | 8 test: hợp lệ + error cases | Hoàn thành 8 test | Không có |
| Bước 5: Test Common scripts | 2 test: typeof function | Hoàn thành 2 test | Không có |
| Bước 6: Test Loader class | 4 test: constructor, import rỗng, import throw, load version thấp | Hoàn thành 4 test | Không có |
| Bước 7: Chạy kiểm tra | lint, typecheck, test | Tất cả pass | Không có |

## Sai lệch đáng chú ý

- **Sai lệch Bước 2:** Test `defaultArgs()` mặc định có `--bas-force-visible-window` là sai. Thực tế `headless` default = `!devtools` = `true` (headless mode) -> có `--hide-scrollbars` và `--mute-audio`, không có `--bas-force-visible-window`. Đã sửa test cho đúng với behavior của code.

## Tài liệu liên quan

- `docs/designs/test-error-classes-utilities.design.md`
- `docs/specs/test-error-classes-utilities.spec.md`
- `docs/plans/test-error-classes-utilities.plan.md`
- `tests/utils.test.ts` (tạo mới)

## Ghi chú

- `common/index.ts` chỉ test typeof function vì script chạy trong browser context, không thể test logic thật trong unit test thuần.
- `Loader.import()` dùng `require()` thật qua `createRequire` -> cần mock bằng package name không tồn tại để test throw.
