# Overview: Cấu hình Proxy

## Lưu ý kỹ thuật

- `changeGeolocation` default `false` -- vì geolocation cần user permission ở browser, có thể gây popup.
- `ipExtractionMethod` hỗ trợ `'jsonpath'`, `'xpath'`, `'regexp'`, `'raw'` -- engine binary dùng method này để parse IP từ response của `ipExtractionURL`.
- `ipInfoMethod` có 2 giá trị: `'database'` (tra cứu local database) và `'ip-api.com'` (gọi API).
- `IPString = string & {}` là branded type -- chỉ có ý nghĩa lúc compile. Runtime không có check.
- `enableQUIC` default `false` -- QUIC protocol có thể bypass proxy. Bật lên khi proxy support QUIC.
- `changeWebRTC: 'replace'` -- cơ chế: engine binary override IP trong SDP offer/answer, IP thật không bao giờ lộ.
