# Product: Cấu hình Proxy

## Tổng quan

Proxy config với 19 option cho phép kiểm soát chi tiết routing, WebRTC, DNS và đồng bộ thông tin vị trí.

## Cách dùng

```ts
Chromium.useProxy('http://user:pass@192.168.1.1:8080', {
  changeTimezone: true,
  changeGeolocation: true,
  changeWebRTC: 'replace',
  dnsMode: 'custom-direct',
  enableTunneling: true,
  detectExternalIP: true,
});
```

## WebRTC

- `enable`: Bật WebRTC -- có thể lộ IP thật
- `disable`: Tắt hoàn toàn WebRTC -- một số site cần WebRTC cho chat/video
- `replace` (default): Thay IP trong WebRTC bằng IP proxy -- an toàn nhất

## DNS

- `system-proxy`: DNS qua proxy -- mặc định
- `custom-proxy`: DNS custom qua proxy
- `custom-direct`: DNS custom trực tiếp (không qua proxy) -- traffic còn lại vẫn qua proxy

## Đồng bộ thông tin

Khi bật `changeGeolocation` hoặc `changeTimezone`, engine tự động lookup thông tin từ IP proxy và inject vào browser.
