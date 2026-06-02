# Overview: Cấu hình Fingerprint

## Lưu ý kỹ thuật

- Fingerprint không được validate ở tầng JavaScript -- toàn bộ việc parse fingerprint JSON và áp dụng các option (PerfectCanvas, WebGL noise v.v.) do engine binary (C++) xử lý. Nếu fingerprint JSON sai format, lỗi sẽ xuất hiện từ engine response dưới dạng raw string (không phải PluginError).
- `safeElementSize` default `false` vì nó can thiệp vào `Element.getBoundingClientRect()` và `Element.prototype.clientWidth/Height`. Một số website dùng các API này cho layout, bật lên có thể gây lỗi hiển thị.
- Fingerprint data JSON string chứa thông tin: GPU model, WebGL vendor/renderer, canvas fingerprint hash, audio fingerprint, font list, screen resolution, deviceScaleFactor. Định dạng cụ thể do bablosoft service quy định.
- Khi fetch fingerprint qua `newFingerprint(options)`, engine gọi `api('fetch', { key, options, version })`. Nếu key không hợp lệ, engine respond với lỗi `'key is missing'` → throw `MissingKeyError`. Cần key BASIC/PRO để fetch fingerprint.
- `usePerfectCanvas` và `safeWebGL` liên quan đến WebGL context -- có thể gây crash trên GPU cũ hoặc driver lỗi. Engine tự fallback về safe mode nếu gặp lỗi.
