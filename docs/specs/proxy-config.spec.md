# Spec: Cấu hình Proxy

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Tính năng proxy định tuyến toàn bộ traffic trình duyệt qua HTTP/HTTPS/SOCKS4/SOCKS5 proxy. Engine tự động đồng bộ timezone, geolocation, ngôn ngữ, WebRTC, DNS theo IP của proxy. Tất cả xử lý proxy ở tầng C/C++ — không có dấu vết trong JavaScript context.

Source types: `src/types/proxy.ts` (210 dòng). Source config: `src/plugin/index.ts`.

## Yêu cầu

- Hỗ trợ HTTP, HTTPS, SOCKS4, SOCKS5 proxy.
- Proxy URL format: `protocol://user:pass@host:port` (có auth) hoặc `protocol://host:port` (không auth).
- Tự động đồng bộ timezone theo IP proxy (mặc định `true`).
- Tự động đồng bộ ngôn ngữ trình duyệt theo quốc gia proxy (mặc định `true`).
- Tuỳ chọn đồng bộ geolocation (mặc định `false`).
- WebRTC: `enable`, `disable`, hoặc `replace` IP bằng IP proxy (mặc định `replace`).
- Hỗ trợ 3 chế độ DNS: `system-proxy`, `custom-proxy`, `custom-direct`.
- Tunneling tích hợp (mặc định `true`).
- QUIC/UDP (mặc định `false`).
- Tự động phát hiện IP public qua proxy (mặc định `true`).
- Trích xuất proxy từ `--proxy-server` argument nếu `useProxy()` chưa được gọi (fallback).
- Hỗ trợ object notation cho các field IPv4/IPv6 (cấu hình riêng `{ v4, v6 }`).

## Thiết kế

### Luồng dữ liệu

```
User gọi useProxy(url, options)
  │
  ├─ validateConfig('proxy', value, options)
  │
  └─ FingerprintPlugin.useProxy()
       └─ this.proxy = { value, options }
            │
            ├─ _launch() gửi lên engine: proxy: { value, options }
            │
            └─ Engine (C/C++):
                 ├─ Thiết lập proxy ở tầng native
                 ├─ Đồng bộ timezone/geolocation/language
                 ├─ Cấu hình WebRTC
                 └─ Cấu hình DNS
```

### Fallback từ args

Nếu user không gọi `useProxy()`, `setProxyFromArguments()` trong `_launch()` tìm `--proxy-server` trong `options.args`. Nếu tìm thấy, tự động gọi `useProxy()` với URL đó.

Tham chiếu design doc: `docs/designs/proxy-config.design.md`.

## API / Data flow

```ts
plugin.useProxy('http://user:pass@192.168.1.1:8080', {
  changeTimezone: true,           // đồng bộ timezone
  changeGeolocation: false,       // từ chối mọi yêu cầu vị trí
  changeBrowserLanguage: true,    // đồng bộ Accept-Language
  changeWebRTC: 'replace',        // thay IP WebRTC bằng IP proxy
  dnsMode: 'custom-direct',       // DNS tuỳ chỉnh
  dnsIP: '1.1.1.1',
  enableTunneling: true,
  enableQUIC: false,
});

// Proxy không auth
plugin.useProxy('socks5://192.168.1.1:1080');

// Cấu hình WebRTC riêng IPv4/IPv6
plugin.useProxy(url, {
  changeWebRTC: 'replace',
  publicIPv4: 'auto',
  publicIPv6: 'disable',
  privateIPv4: 'local',
});
```

### ProxyOptions

| Field | Type | Default | Mô tả |
|---|---|---|---|
| `changeBrowserLanguage` | `boolean` | `true` | Đổi `Accept-Language` và `navigator.language` theo quốc gia IP proxy. |
| `changeGeolocation` | `boolean` | `false` | Đổi vị trí địa lý. Nếu `false`, browser từ chối mọi yêu cầu truy cập vị trí. |
| `changeTimezone` | `boolean` | `true` | Đổi múi giờ theo IP proxy. |
| `changeWebRTC` | `'enable' \| 'disable' \| 'replace'` | `'replace'` | `enable`: lộ IP thật. `disable`: tắt WebRTC. `replace`: thay bằng IP proxy. |
| `publicIPv4` | `PublicIPReplacement` | `'auto'` | IPv4 public hiển thị trong WebRTC. Cần `changeWebRTC: 'replace'`. |
| `publicIPv6` | `PublicIPReplacement` | `'auto'` | IPv6 public hiển thị trong WebRTC. |
| `privateIPv4` | `PrivateIPReplacement \| 'private class a' \| 'private class b' \| 'private class c'` | `'local'` | IPv4 nội bộ. |
| `privateIPv6` | `PrivateIPReplacement \| 'unique local address'` | `'local'` | IPv6 nội bộ. |
| `ipExtractionMethod` | `IPExtractionMethod \| { v4: IPExtractionMethod; v6: IPExtractionMethod }` | `'raw'` | Phương thức trích xuất IP từ `ipExtractionURL`. Object notation cho riêng IPv4/IPv6. |
| `ipExtractionParam` | `string \| { v4: string; v6: string }` | `''` | Tham số cho extraction method (xpath, regexp, jsonpath). |
| `ipExtractionURL` | `string \| { v4: string; v6: string }` | `''` | URL chứa IP để trích xuất. |
| `detectExternalIP` | `boolean \| { v4: boolean; v6: boolean }` | `true` | Tự phát hiện IP public. |
| `ipInfoMethod` | `'database' \| 'ip-api.com'` | `'database'` | `database`: nhanh, kém chính xác. `ip-api.com`: chính xác, giới hạn 45 request/IP (free). |
| `ipInfoKey` | `string` | `''` | API key ip-api.com (bản trả phí). |
| `enableTunneling` | `boolean` | `true` | Bật tunneling tích hợp. Nếu `false`, proxy không hoạt động — dùng khi đã có VPN. |
| `enableQUIC` | `boolean` | `false` | Bật QUIC/UDP. Chỉ bật nếu proxy hỗ trợ UDP. |
| `dnsMode` | `'system-proxy' \| 'custom-proxy' \| 'custom-direct'` | `'system-proxy'` | `system-proxy`: DNS hệ thống. `custom-proxy`: DNS qua proxy (yêu cầu UDP). `custom-direct`: DNS cục bộ, traffic qua proxy. |
| `dnsIP` | `string` | `'1.1.1.1'` | DNS server IP. Có hiệu lực khi dnsMode là `custom-proxy` hoặc `custom-direct`. |

### Type helpers

| Type | Giá trị |
|---|---|
| `IPString` | `string & {}` — branded type cho địa chỉ IP |
| `IPExtractionMethod` | `'raw' \| 'xpath' \| 'regexp' \| 'jsonpath'` |
| `PublicIPReplacement` | `IPString \| 'disable' \| 'auto'` |
| `PrivateIPReplacement` | `IPString \| 'disable' \| 'local'` |

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/types/proxy.ts` | `ProxyOptions` + type helpers | 210 |
| `src/plugin/index.ts` | `useProxy()` — validate + lưu config + `setProxyFromArguments()` | 302 |
| `src/adapter/playwright/chromium.ts` | `useProxy()` public API ở BrowserEngine | 231 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Proxy URL không đúng format | `validateConfig()` throw Error |
| `ipInfoMethod` là `ip-api.com` nhưng thiếu key | Engine từ chối, báo lỗi qua API response |
| Proxy không hoạt động | Engine tự báo lỗi qua API response |
| Không gọi `useProxy()` và không có `--proxy-server` trong args | Engine launch không proxy |

## Kiểm tra

- Happy path: `useProxy(url)` + launch → traffic qua proxy, timezone đồng bộ.
- Happy path: `setProxyFromArguments(['--proxy-server=http://host:8080'])` set proxy nếu chưa có.
- Edge case: proxy không auth, proxy SOCKS5.
- Error: URL sai format → throw Error.
- Error: `ipInfoMethod` là `ip-api.com` không key → engine báo lỗi.
- Object notation: `ipExtractionMethod: { v4: 'raw', v6: 'xpath' }`.
