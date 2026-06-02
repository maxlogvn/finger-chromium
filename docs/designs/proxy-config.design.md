# Design: Cấu hình Proxy

## Vấn đề

Traffic browser cần route qua proxy. Cần đồng bộ timezone, geolocation, ngôn ngữ theo proxy. WebRTC có thể rò rỉ IP thật nếu không xử lý.

## Giải pháp

19-field `ProxyOptions` cho phép kiểm soát chi tiết. Proxy data (URL string) được truyền xuống engine binary, engine tự xử lý routing.

### Các nhóm option

1. **Đồng bộ thông tin**: `changeBrowserLanguage`, `changeGeolocation`, `changeTimezone` -- tự động sync từ proxy IP
2. **WebRTC**: `changeWebRTC` -- 'enable' | 'disable' | 'replace' (default: 'replace')
3. **DNS**: `dnsMode` -- 'system-proxy' | 'custom-proxy' | 'custom-direct' + `dnsIP`
4. **IP detection**: `detectExternalIP`, `ipExtractionMethod`, `ipExtractionParam`, `ipExtractionURL` -- kiểm soát cách lấy IP public
5. **IP replacement**: `publicIPv4`, `publicIPv6`, `privateIPv4`, `privateIPv6` -- thay thế IP trong WebRTC
6. **Tunneling + QUIC**: `enableTunneling`, `enableQUIC`
7. **IP info**: `ipInfoMethod`, `ipInfoKey` -- cách tra cứu thông tin IP

### IPString brand

Để phân biệt IP string với regular string ở compile time, dùng branded type:
```ts
type IPString = string & {};
```
Runtime vẫn là string, chỉ TypeScript phân biệt.

### Luồng xử lý

1. `useProxy(url, options)` → lưu `PluginConfig { value: url, options }`
2. `_launch()` kiểm tra `--proxy-server` trong args nếu proxy chưa set (fallback)
3. Gửi proxy config qua `api('setup', { proxy: config, ... })`
4. Engine binary cấu hình proxy cho browser process

---

Xem thêm: [Spec](../specs/proxy-config.spec.md) | [Plan](../plans/proxy-config.plan.md)
