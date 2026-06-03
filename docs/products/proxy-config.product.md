# Product: Cấu hình Proxy

## Mô tả

Tính năng proxy định tuyến toàn bộ traffic trình duyệt qua HTTP/HTTPS/SOCKS4/SOCKS5 proxy. Engine tự động đồng bộ timezone, geolocation, ngôn ngữ, WebRTC, DNS theo IP của proxy. Tất cả xử lý ở tầng C/C++ — không có dấu vết trong JavaScript context.

## Cách sử dụng

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();

const context = await engine
  .useProxy('http://user:pass@192.168.1.1:8080', {
    changeTimezone: true,         // đồng bộ timezone theo IP proxy
    changeGeolocation: true,      // đồng bộ vị trí địa lý
    changeBrowserLanguage: true,  // đồng bộ Accept-Language
    changeWebRTC: 'replace',      // thay IP WebRTC bằng IP proxy
    dnsMode: 'custom-direct',     // DNS tuỳ chỉnh
    dnsIP: '1.1.1.1',
  })
  .launch()
  .newContext();
```

Proxy không auth:

```ts
.useProxy('socks5://192.168.1.1:1080')
```

Proxy cũng có thể được trích xuất từ Playwright launch options (nếu không gọi `useProxy()`).

## Hành vi chi tiết

| Option | Mặc định | Giải thích |
|---|---|---|
| `changeBrowserLanguage` | `true` | Đổi `Accept-Language` và `navigator.language` theo quốc gia IP proxy. |
| `changeGeolocation` | `false` | Nếu tắt, browser từ chối mọi yêu cầu truy cập vị trí. |
| `changeWebRTC` | `'replace'` | Thay IP trong WebRTC bằng IP proxy. Cấu hình riêng IPv4/IPv6 public và private. |
| `dnsMode` | `'system-proxy'` | `'custom-direct'`: DNS tuỳ chỉnh với traffic qua proxy. `'custom-proxy'`: DNS qua proxy (yêu cầu proxy hỗ trợ UDP). |
| `enableTunneling` | `true` | Nếu `false`, proxy không hoạt động — dùng khi đã có VPN hoặc muốn kết nối trực tiếp. |
| `enableQUIC` | `false` | Chỉ bật nếu proxy server hỗ trợ UDP. |

## Giới hạn và điều kiện

- Proxy URL phải đúng format: `protocol://user:pass@host:port` (có auth) hoặc `protocol://host:port` (không auth).
- Chỉ hỗ trợ Windows 32-bit và 64-bit.
- Engine tự kiểm tra proxy — nếu không hoạt động, `_launch()` throw error.
- `dnsMode: 'custom-proxy'` yêu cầu proxy hỗ trợ UDP.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/proxy-config.spec.md`
- Design: `docs/designs/proxy-config.design.md`
- Source: `src/plugin/config.ts`
