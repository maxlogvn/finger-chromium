# Plan: Cấu hình Proxy

- [x] Bước 1: Định nghĩa ProxyOptions interface -- 19 fields, IPString brand type
  - `IPString = string & {}`: branded type cho compile-time checking
  - Nhiều field hỗ trợ `{ v4, v6 }` object (IPv4/IPv6 riêng)

- [x] Bước 2: Implement useProxy() trong FingerprintPlugin
  - Lưu `PluginConfig { value: proxyUrl, options: ProxyOptions }`
  - `validateConfig('proxy', value, options)`: value là URL string, options là object

- [x] Bước 3: Implement setProxyFromArguments() -- fallback khi proxy config từ args
  - Parse `--proxy-server=<url>` từ mảng args
  - Chỉ set nếu proxy chưa được cấu hình qua useProxy()

- [x] Bước 4: Tích hợp proxy vào api('setup') parameters
  - `{ ..., proxy: { value, options } }` → engine binary xử lý routing

## Edge cases

- Proxy URL không hợp lệ → engine binary reject khi setup
- setProxyFromArguments() ghi đè proxy config -- có thể gây unexpected behavior nếu dùng cả 2 cách
- `changeGeolocation` default false → không ảnh hưởng tới popup permission
- `enableQUIC` default false → QUIC có thể bypass proxy tunnel
- `ipExtractionMethod` phải match với response format của ipExtractionURL
