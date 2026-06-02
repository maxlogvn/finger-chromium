# Overview: Cấu hình Proxy

## Tóm tắt

Đã triển khai tính năng định tuyến traffic qua proxy với đồng bộ timezone, geolocation, WebRTC, DNS. Proxy config được gửi lên engine native qua API `setup` sau khi `useProxy()` được gọi. Hỗ trợ HTTP/HTTPS/SOCKS4/SOCKS5, cấu hình riêng IPv4/IPv6.

## Kiến trúc

```
types/proxy.ts                   -> ProxyOptions interface (18 fields), branded IPString
plugin/index.ts (useProxy)       -> validateConfig -> this.proxy = { value, options }
plugin/index.ts (setProxyFromArguments) -> fallback từ --proxy-server
plugin/index.ts (_launch)        -> api('setup', { proxy: this.proxy })
engine native (C/C++)            -> xử lý tunneling, WebRTC, DNS, timezone, geolocation
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `ProxyOptions` interface | `src/types/proxy.ts` | 14-210 |
| `IPString` branded type | `src/types/proxy.ts` | 16 |
| `IPExtractionMethod` type | `src/types/proxy.ts` | 18 |
| `useProxy()` (FingerprintPlugin) | `src/plugin/index.ts` | 125-129 |
| `setProxyFromArguments()` | `src/plugin/index.ts` | 147-152 |
| `useProxy()` (BrowserEngine) | `src/adapter/playwright/chromium.ts` | 107-111 |
| Gửi config lên engine | `src/plugin/index.ts` | 239-249 |

## 18 fields trong ProxyOptions

| Field | Type | Default | Mô tả |
|---|---|---|---|
| `changeBrowserLanguage` | `boolean` | `true` | Accept-Language header |
| `changeGeolocation` | `boolean` | `false` | Navigator.geolocation |
| `changeTimezone` | `boolean` | `true` | Intl.DateTimeFormat |
| `changeWebRTC` | `'enable'\|'disable'\|'replace'` | `'replace'` | WebRTC IP handling |
| `publicIPv4` | `PublicIPReplacement` | `'auto'` | Public IPv4 qua WebRTC |
| `publicIPv6` | `PublicIPReplacement` | `'auto'` | Public IPv6 |
| `privateIPv4` | `PrivateIPReplacement \| 'private class a'\|'b'\|'c'` | `'local'` | Private IPv4 |
| `privateIPv6` | `PrivateIPReplacement \| 'unique local address'` | `'local'` | Private IPv6 |
| `ipExtractionMethod` | `IPExtractionMethod \| { v4, v6 }` | `'raw'` | Cách lấy IP từ response |
| `ipExtractionParam` | `string \| { v4, v6 }` | `''` | Tham số extraction |
| `ipExtractionURL` | `string \| { v4, v6 }` | `''` | URL kiểm tra IP |
| `detectExternalIP` | `boolean \| { v4, v6 }` | `true` | Auto detect external IP |
| `ipInfoMethod` | `'database' \| 'ip-api.com'` | `'database'` | Phương thức tra cứu geo |
| `ipInfoKey` | `string` | `''` | API key ip-api.com |
| `enableTunneling` | `boolean` | `true` | Bật/tắt tunneling |
| `enableQUIC` | `boolean` | `false` | QUIC over UDP |
| `dnsMode` | `'system-proxy'\|'custom-proxy'\|'custom-direct'` | `'system-proxy'` | DNS resolution mode |
| `dnsIP` | `string` | `'1.1.1.1'` | Custom DNS IP |

## DNS modes

- **`system-proxy`** (default): DNS hệ thống -> hostname gửi đến proxy.
- **`custom-proxy`**: DNS tùy chỉnh -> query qua proxy (yêu cầu UDP support).
- **`custom-direct`**: DNS tùy chỉnh -> query local -> traffic còn lại qua proxy.

## Quyết định thiết kế

- **Object notation cho complex fields**: `ipExtractionMethod`, `ipExtractionParam`, `ipExtractionURL`, `detectExternalIP` có thể là value đơn hoặc `{ v4, v6 }` object. Cho phép cấu hình IPv4/IPv6 riêng.
- **`IPString` branded type**: `string & {}` -- zero-cost type safety. TypeScript không cho gán raw string, ép user cast.
- **`setProxyFromArguments()` fallback**: Nếu user không gọi `useProxy()` nhưng có `--proxy-server` trong launch args, plugin tự động dùng arg đó. Không fallback nếu `useProxy()` đã được gọi.
- **DNS modes**: 3 chế độ cho user linh hoạt routing. `system-proxy` cho đơn giản, `custom-*` cho kiểm soát chi tiết.

## Flow setProxyFromArguments

```
setProxyFromArguments(args)
  -> this.proxy == null? (chưa gọi useProxy?)
     -> tìm arg.includes('--proxy-server')
        -> this.useProxy(arg.slice(15))  -> lấy URL sau '--proxy-server='
     -> không tìm thấy? -> return this (không đổi)
```

## Lưu ý

- Proxy hoàn toàn do engine native xử lý -- plugin chỉ gửi config.
- `enableTunneling` false = proxy không hoạt động (dùng VPN).
- `enableQUIC` = QUIC over UDP -- proxy cần hỗ trợ.
- `ipInfoMethod = 'ip-api.com'` cần `ipInfoKey` nếu dùng nhiều request.
- Object notation cho phép `{ v4: 'auto', v6: 'disable' }`.

## Tài liệu liên quan

- `docs/designs/proxy-config.design.md`
- `docs/specs/proxy-config.spec.md`
- `docs/plans/proxy-config.plan.md`
- `docs/products/proxy-config.product.md`
- `src/types/proxy.ts`
- `src/plugin/index.ts`
