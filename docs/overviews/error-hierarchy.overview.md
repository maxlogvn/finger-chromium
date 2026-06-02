# Overview: Hệ thống lỗi

Hoàn thành. 5 class trong `src/plugin/errors.ts` (78 dòng).

## Lưu ý

- `Error.captureStackTrace` là V8 API, không hoạt động trên một số JavaScript engine không phải V8. Hiện tại chỉ chạy Node.js (dùng V8) nên an toàn.
- `plugin.ts` line 282 có comment về catch all errors at top level -- thực tế chưa implement đầy đủ error boundary ở top level. Chỉ connector layer mới có error normalization.
- `MissingKeyError` message dùng `dedent` -- nếu không có thư viện dedent, cần fallback trim.
