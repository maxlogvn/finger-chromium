# Overview: Bug #19 — `isBrowser` type guard dùng string check fragile

## Tóm tắt

`isBrowser()` dùng duck-typing single-property (`'version'`) gây rủi ro false positive nếu Playwright đổi API. Đã fix bằng cách kiểm tra đồng thời 3 method (`version`, `isConnected`, `contexts`) chỉ có trên `Browser`. Thay đổi chỉ gói gọn trong 1 hàm, không ảnh hưởng module khác.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Sửa hàm `isBrowser()` | Thêm check `isConnected` và `contexts` | Đã thêm cả 2 check vào điều kiện | Không có |
| Bước 2: Kiểm tra code | lint, typecheck, build | lint 0 errors, tsc --noEmit clean, build success, 20 tests pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-019-isbrowser-typeguard.design.md`
- `docs/specs/bug-019-isbrowser-typeguard.spec.md`
- `docs/plans/bug-019-isbrowser-typeguard.plan.md`
- File đã sửa trong code:
  - `src/adapter/playwright/utils.ts` — hàm `isBrowser()`
- File đã cập nhật ở bước rà soát:
  - `docs/KNOWN_ISSUES.md` — chuyển #19 từ OPEN sang FIXED, cập nhật mapping
  - `docs/Welcome.md` — cập nhật số lượng OPEN issues

## Ghi chú

Lưu ý: GitHub issue [#12](https://github.com/maxlogvn/finger-chromium/issues/12) cần được cập nhật comment và đóng sau khi commit.
