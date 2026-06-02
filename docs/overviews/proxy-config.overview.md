# Overview: Cấu hình Proxy

## Mục tiêu

Định nghĩa `ProxyOptions` interface với 18 fields kiểm soát chi tiết proxy, WebRTC, DNS, tunneling.

## Kết quả

- `src/types/proxy.ts`: 210 dòng, interface `ProxyOptions` + types hỗ trợ.
- Tích hợp vào `FingerprintPlugin` qua `useProxy()` và `setProxyFromArguments()`.

## Kiểm tra

- `npm run lint` -- 0 errors.

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### `changeGeolocation` default `false`
Geolocation API cần user permission ở browser -- có thể gây popup. Mặc định tắt để tránh làm phiền user.

### `IPString = string & {}` là branded type
Chỉ có ý nghĩa lúc compile. Runtime không có validation -- bất kỳ string nào cũng được chấp nhận.

### `privateIPv4` special values
Ngoài IP cụ thể, hỗ trợ `'private class a'` (10.x.x.x), `'private class b'` (172.16-31.x.x), `'private class c'` (192.168.x.x) -- tương ứng các dải IP private.

### `privateIPv6` special value
Hỗ trợ `'unique local address'` (fd00::/8).

### Dual stack ({ v4, v6 })
4 fields hỗ trợ cấu hình riêng IPv4/IPv6: `detectExternalIP`, `ipExtractionMethod`, `ipExtractionParam`, `ipExtractionURL`.

### `setProxyFromArguments()` dùng `slice(15)`
Cắt `--proxy-server=` prefix -- fragile nếu format thay đổi.

### `enableQUIC` default `false`
QUIC chạy trên UDP, có thể bypass proxy tunnel. Chỉ bật khi proxy server hỗ trợ UDP.

---
