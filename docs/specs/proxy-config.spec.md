# Spec: Cấu hình Proxy

## Mô tả

Cấu hình proxy khi gọi `useProxy(data, options)`.

## Options chính

| Option | Type | Default | Mô tả |
|---|---|---|---|
| `changeBrowserLanguage` | boolean | true | Ngôn ngữ theo proxy |
| `changeGeolocation` | boolean | false | Vị trí địa lý |
| `changeTimezone` | boolean | true | Múi giờ |
| `changeWebRTC` | enum | 'replace' | WebRTC |
| `enableTunneling` | boolean | true | Tunneling |
| `enableQUIC` | boolean | false | QUIC |
| `dnsMode` | enum | 'system-proxy' | DNS |

## Hỗ trợ giao thức

HTTP, HTTPS, SOCKS4, SOCKS5.

---

Xem thêm: [Design](../designs/proxy-config.design.md) | [Plan](../plans/proxy-config.plan.md)
