# Plan: Cấu hình Fingerprint

- [x] Bước 1: Định nghĩa FingerprintOptions interface -- 9 boolean flags (8 default true, 1 false)
  - `safeElementSize`: default false (có thể ảnh hưởng layout)
  - Còn lại: default true (bảo vệ tối đa)

- [x] Bước 2: Implement useFingerprint() trong FingerprintPlugin
  - Lưu `PluginConfig { value: fingerprintJson, options: FingerprintOptions }`
  - `validateConfig('fingerprint', value, options)`: value phải là string (JSON), options là object

- [x] Bước 3: Tích hợp fingerprint vào api('setup') parameters
  - `{ ..., fingerprint: { value, options } }` → gửi xuống engine binary
  - Engine binary chịu trách nhiệm parse và inject ở C level

- [x] Bước 4: Hỗ trợ fingerprint fetching qua api('fetch')
  - `fetch(FetchOptions)`: gọi `api('fetch', { key, options, version })`
  - Filter theo tags, timeLimit, screen size, browser version

## Edge cases

- Fingerprint JSON không hợp lệ → lỗi xuất hiện từ engine response, không validate ở JS layer
- `fetch()` không có key hợp lệ → engine trả error 'key is missing' → throw MissingKeyError
- `emulateDeviceScaleFactor` không tương thích với một số GPU → engine tự fallback
