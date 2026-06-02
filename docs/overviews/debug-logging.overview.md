# Overview: Debug Logging

## Lưu ý kỹ thuật

- `debug` package dùng `process.env.DEBUG` để quyết định log namespace nào. Nếu `DEBUG` không set, tất cả logger đều là no-op.
- Output format: `namespace message +elapsed-time`. Elapsed time là time từ lúc process start.
- `debug` package tự động thêm màu sắc dựa trên namespace -- mỗi namespace một màu khác nhau.
- Trong Windows, cần `set DEBUG=...` thay vì `DEBUG=...` (cross-env nếu dùng npm scripts).
