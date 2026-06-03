# Overview: Bug #9 — `BrowserEngine.launch()` dùng `Error` thô

## Tóm tắt

Đã sửa 3 `throw new Error(...)` trong `src/adapter/playwright/chromium.ts` thành `throw new PluginError(...)` — tuân thủ CONVENTIONS.md yêu cầu mọi lỗi engine dùng `PluginError`.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| Bước 1: Sửa chromium.ts | Thêm import, đổi 3 throw Error → PluginError | Đã làm đúng | Không có |
| Bước 2: Kiểm tra | lint + typecheck + build | lint pass (0 errors), build pass | typecheck có 2 lỗi pre-existing ở pcapServer (không liên quan) |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-009-error-tho.design.md`
- `docs/specs/bug-009-error-tho.spec.md`
- `docs/plans/bug-009-error-tho.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #9 từ OPEN sang FIXED

## Ghi chú

Cần close GitHub issue [#1](https://github.com/maxlogvn/finger-chromium/issues/1) tương ứng.
