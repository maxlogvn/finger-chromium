# Overview: Debug Logging

## Mục tiêu

Thêm structured logging với `debug` package, 4 namespace theo module.

## Kết quả

- 4 file sử dụng `debug`: `connector/index.ts`, `connector/engine.ts`, `connector/pcapServer/index.ts`, `plugin/cleaner.ts`.
- Namespace convention: `browser-with-fingerprints:<module>`.

## Kiểm tra

- `npm run lint` -- 0 errors.

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### `debug` output format

```
namespace message +elapsed-time
```

Elapsed time là milliseconds từ process start (Date.now() - process startup). Không phải timestamp tuyệt đối.

### Output ra stderr

`debug` package ghi ra `process.stderr`, không phải stdout. Redirect: `node script.js 2> debug.log`.

### Tắt màu

`DEBUG_COLORS=no` hoặc `NO_COLOR=1`.

### Wildcard pattern

`DEBUG=browser-with-fingerprints:connector,browser-with-fingerprints:cleaner` hoặc `DEBUG=browser-with-fingerprints:*`. Wildcard `*` match mọi namespace bắt đầu với `browser-with-fingerprints:`.

### Trên Windows

Dùng `set DEBUG=browser-with-fingerprints:*` (cmd) hoặc `$env:DEBUG='browser-with-fingerprints:*'` (PowerShell). `export` không hoạt động trên Windows.

### Performance

Nếu `DEBUG` env không match namespace, function trả về no-op. Zero overhead ở runtime -- không có string formatting hay I/O.

---
