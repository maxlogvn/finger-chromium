# Overview: Debug Logging

## Lưu ý kỹ thuật

- `debug` package dùng `process.env.DEBUG` để quyết định log namespace nào. `debug('fingerprint:connector')` trả về function. Nếu `DEBUG` env không match namespace, function là no-op -- zero overhead.
- Output format: `namespace message +elapsed-time`. Elapsed time là milliseconds từ khi process start (Date.now() - process startup). Không phải timestamp tuyệt đối.
- Mỗi namespace được gán màu khác nhau tự động. `debug` dùng `supports-color` package để detect terminal color support.
- Trên Windows, dùng `set DEBUG=fingerprint:*` (cmd) hoặc `$env:DEBUG='fingerprint:*'` (PowerShell). `export DEBUG=...` không hoạt động trên Windows.
- Nếu dùng npm scripts, cần cross-env hoặc set trực tiếp trong script:
  ```json
  "dev": "set DEBUG=fingerprint:* && tsx src/index.ts"
  ```
- Có thể dùng wildcard pattern: `DEBUG=fingerprint:connector,fingerprint:plugin` hoặc `DEBUG=fingerprint:*`. Wildcard `*` match mọi namespace bắt đầu với `fingerprint:`.
