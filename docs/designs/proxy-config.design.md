# Design: Cấu hình Proxy

## Vấn đề

Traffic browser cần route qua proxy để che giấu IP thật. Cần đồng bộ timezone, geolocation, ngôn ngữ theo proxy.

## Giải pháp

`useProxy(data, options)` hỗ trợ:
- HTTP/HTTPS/SOCKS4/SOCKS5
- Đồng bộ timezone, geolocation, ngôn ngữ
- WebRTC: enable/disable/replace IP
- DNS: system-proxy/custom-proxy/custom-direct
- Tunneling + QUIC
- IP detection (tự động phát hiện IP public)

---

Xem thêm: [Spec](../specs/proxy-config.spec.md) | [Plan](../plans/proxy-config.plan.md)
