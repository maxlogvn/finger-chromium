# Design: Cấu hình Proxy

## Vấn đề

Traffic browser cần route qua proxy để che giấu IP thật. Cần đồng bộ timezone, geolocation, ngôn ngữ theo proxy. WebRTC có thể rò rỉ IP thật nếu không xử lý.

## Giải pháp

Interface `ProxyOptions` với 18 fields, chia thành 7 nhóm:

### 1. Đồng bộ thông tin
- `changeBrowserLanguage` (default `true`) -- ngôn ngữ theo proxy.
- `changeGeolocation` (default `false`) -- vị trí địa lý, mặc định tắt vì gây popup permission.
- `changeTimezone` (default `true`) -- múi giờ tự động theo IP proxy.

### 2. WebRTC
- `changeWebRTC`: `'enable' | 'disable' | 'replace'` (default `'replace'`).
- `publicIPv4`, `publicIPv6`: IP công khai hiển thị (default `'auto'`).
- `privateIPv4`, `privateIPv6`: IP nội bộ hiển thị (default `'local'`).
- `privateIPv4` hỗ trợ `'private class a' | 'private class b' | 'private class c'`.
- `privateIPv6` hỗ trợ `'unique local address'`.

### 3. DNS
- `dnsMode`: `'system-proxy' | 'custom-proxy' | 'custom-direct'` (default `'system-proxy'`).
- `dnsIP`: địa chỉ DNS server (default `'1.1.1.1'`).

### 4. IP Detection
- `detectExternalIP` (default `true`) -- tự động phát hiện IP public.
- `ipExtractionMethod`, `ipExtractionParam`, `ipExtractionURL` -- kiểm soát cách trích xuất IP từ response.
- Hỗ trợ `{ v4, v6 }` object để cấu hình riêng IPv4/IPv6.

### 5. IP Info
- `ipInfoMethod`: `'database' | 'ip-api.com'` (default `'database'`).
- `ipInfoKey`: API key cho ip-api.com bản trả phí.

### 6. Tunneling + QUIC
- `enableTunneling` (default `true`) -- bật tunneling.
- `enableQUIC` (default `false`) -- QUIC trên UDP, tắt mặc định vì có thể bypass proxy.

### 7. Branded Type `IPString`
```ts
type IPString = string & {};
```
Chỉ có ý nghĩa compile time, runtime vẫn là string.

### Luồng xử lý

1. User gọi `useProxy(url, options)` -> lưu `PluginConfig { value: url, options }`.
2. Nếu proxy chưa set, `setProxyFromArguments()` fallback parse `--proxy-server` từ args.
3. Gửi proxy config qua `api('setup', { proxy: config, ... })`.
4. Engine binary cấu hình proxy và các option liên quan cho browser process.

---

Xem thêm: [Spec](../specs/proxy-config.spec.md) | [Plan](../plans/proxy-config.plan.md)
