# Product: Cấu hình Proxy

## Tổng quan

Proxy config cho phép route traffic browser, đồng bộ thông tin vị trí theo proxy, kiểm soát WebRTC và DNS. Hỗ trợ HTTP/HTTPS/SOCKS4/SOCKS5.

## Cách dùng

```ts
// Cơ bản
Chromium.useProxy('http://user:pass@192.168.1.1:8080');

// Với options
Chromium.useProxy('socks5://127.0.0.1:9050', {
  changeTimezone: true,
  changeGeolocation: true,
  changeWebRTC: 'replace',
  dnsMode: 'custom-direct',
  enableTunneling: true,
  detectExternalIP: true,
});
```

## Các nhóm option

### Đồng bộ thông tin

| Option | Mặc định | Mô tả |
|---|---|---|
| `changeBrowserLanguage` | `true` | Ngôn ngữ trình duyệt theo proxy |
| `changeGeolocation` | `false` | Vị trí địa lý (mặc định tắt vì gây popup) |
| `changeTimezone` | `true` | Múi giờ tự động theo IP |

### WebRTC

| Giá trị | Mô tả |
|---|---|
| `'enable'` | Bật WebRTC -- có thể lộ IP thật |
| `'disable'` | Tắt WebRTC -- một số site cần WebRTC |
| `'replace'` | Thay IP trong WebRTC bằng IP proxy -- an toàn nhất |

### DNS

| Giá trị | Mô tả |
|---|---|
| `'system-proxy'` | DNS hệ thống, traffic qua proxy |
| `'custom-proxy'` | DNS tuỳ chỉnh qua proxy (cần UDP support) |
| `'custom-direct'` | DNS trực tiếp, traffic còn lại qua proxy |

### IP Detection

Engine tự động phát hiện IP public và thay thế IP trong WebRTC:

```ts
detectExternalIP: true,
ipExtractionMethod: 'jsonpath',
ipExtractionURL: 'https://api.ipify.org?format=json',
ipExtractionParam: '$.ip',
```

### Tunneling

```ts
enableTunneling: true,  // Bật tunneling qua proxy
enableQUIC: false,      // QUIC -- mặc định tắt, có thể bypass proxy
```

## Lưu ý

- SOCKS4/5 cho TCP tunneling, HTTP/HTTPS proxy chỉ route HTTP traffic.
- `changeGeolocation` mặc định false vì geolocation API cần user permission.
- `enableQUIC` nên để false nếu proxy không hỗ trợ QUIC.
- Proxy cũng có thể cấu hình qua arg `--proxy-server=...` (fallback).

---
