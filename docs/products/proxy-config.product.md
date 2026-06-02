# Product: Cấu hình Proxy

## Tổng quan

Proxy config cho phép route traffic browser qua proxy, đồng bộ thông tin vị trí và kiểm soát WebRTC.

## Cách dùng

```ts
Chromium.useProxy('http://user:pass@proxy:8080', {
  changeTimezone: true,
  changeGeolocation: true,
  changeWebRTC: 'replace',
  dnsMode: 'custom-direct',
  enableTunneling: true,
});
```

## WebRTC

- `enable`: bật WebRTC, lộ IP thật
- `disable`: tắt WebRTC
- `replace` (default): thay IP trong WebRTC bằng IP proxy

## DNS

- `system-proxy`: DNS hệ thống qua proxy
- `custom-proxy`: DNS tuỳ chỉnh qua proxy
- `custom-direct`: DNS tuỳ chỉnh, traffic còn lại qua proxy
