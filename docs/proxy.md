# Hướng dẫn cấu hình Proxy

Tài liệu này mô tả chi tiết cách cấu hình proxy cho trình duyệt. Proxy đồng bộ giúp tự động căn chỉnh timezone, geolocation, ngôn ngữ, WebRTC và DNS theo địa chỉ IP của proxy, đảm bảo không có sự sai lệch nào có thể bị phát hiện.

## Tổng quan

Proxy được cấu hình qua `engine.useProxy(url, options)`. URL proxy có định dạng:

```
protocol://user:pass@host:port
```

Ví dụ:
- `http://user123:pass456@192.168.1.1:8080`
- `socks5://admin:secret@10.0.0.5:1080`
- `http://customer-username:password@pr.oxylabs.io:7777`

Khi bật proxy, engine sẽ tự động:
1. Định tuyến toàn bộ traffic qua proxy.
2. Phát hiện IP công khai và vị trí địa lý của proxy.
3. Đồng bộ múi giờ, ngôn ngữ, và WebRTC theo proxy.
4. Áp dụng cấu hình DNS phù hợp.

---

## Cấu hình cơ bản

```ts
engine.useProxy('http://user:pass@host:port', {
  changeBrowserLanguage: true,
  changeGeolocation: true,
  changeTimezone: true,
  changeWebRTC: 'replace',
  enableTunneling: true,
});
```

---

## ProxyOptions -- Tham khảo đầy đủ

### Ngôn ngữ, vị trí, múi giờ

| Thuộc tính              | Kiểu      | Mặc định | Mô tả                                                                                |
| ----------------------- | --------- | -------- | ------------------------------------------------------------------------------------ |
| `changeBrowserLanguage` | `boolean` | `true`   | Tự động đổi ngôn ngữ trình duyệt (`Accept-Language`, `navigator.language`) theo proxy |
| `changeGeolocation`     | `boolean` | `false`  | Đổi vị trí địa lý của trình duyệt theo IP proxy. Nếu tắt: từ chối mọi yêu cầu vị trí   |
| `changeTimezone`        | `boolean` | `true`   | Đổi múi giờ trình duyệt theo IP proxy. Ảnh hưởng `Intl.DateTimeFormat().resolvedOptions().timeZone` |

### WebRTC

WebRTC có thể làm lộ IP thật của bạn ngay cả khi đang dùng proxy. Cấu hình `changeWebRTC` để kiểm soát hành vi này.

```ts
engine.useProxy(proxyUrl, {
  changeWebRTC: 'replace',
  publicIPv4: 'auto',
  publicIPv6: 'auto',
  privateIPv4: 'local',
  privateIPv6: 'local',
});
```

| Thuộc tính    | Kiểu                                                             | Mặc định    | Mô tả                                                                  |
| ------------- | ---------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `changeWebRTC`| `'enable' \| 'disable' \| 'replace'`                             | `'replace'` | `'enable'`: bật WebRTC (lộ IP thật). `'disable'`: tắt WebRTC. `'replace'`: thay IP thật bằng IP proxy |
| `publicIPv4`  | `string \| 'disable' \| 'auto'`                                  | `'auto'`    | Địa chỉ IPv4 công khai hiển thị qua WebRTC. `'auto'` = tự lấy từ proxy  |
| `publicIPv6`  | `string \| 'disable' \| 'auto'`                                  | `'auto'`    | Địa chỉ IPv6 công khai hiển thị qua WebRTC                              |
| `privateIPv4` | `string \| 'disable' \| 'local' \| 'private class a' \| 'private class b' \| 'private class c'` | `'local'` | Địa chỉ IPv4 nội bộ hiển thị qua WebRTC |
| `privateIPv6` | `string \| 'disable' \| 'local' \| 'unique local address'`      | `'local'`   | Địa chỉ IPv6 nội bộ hiển thị qua WebRTC                                |

**Khuyến nghị**: Luôn dùng `changeWebRTC: 'replace'` (mặc định) để tránh lộ IP thật.

### Phát hiện IP công khai

Khi IP kết nối proxy khác với IP hiển thị ra bên ngoài (ví dụ: proxy dùng IP forwarding), bạn cần cấu hình thêm để engine phát hiện đúng IP công khai.

```ts
engine.useProxy(proxyUrl, {
  detectExternalIP: true,
  ipExtractionURL: 'https://api.ipify.org',
  ipExtractionMethod: 'raw',
});
```

| Thuộc tính           | Kiểu                                                                    | Mặc định     | Mô tả                                                                                             |
| -------------------- | ----------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `detectExternalIP`   | `boolean \| { v4: boolean; v6: boolean }`                              | `true`       | Tự động phát hiện IP công khai bằng cách truy vấn service bên ngoài                                 |
| `ipExtractionURL`    | `string \| { v4: string; v6: string }`                                 | `''`         | URL dùng để xác định IP công khai. Response phải chứa địa chỉ IP                                    |
| `ipExtractionMethod` | `'raw' \| 'xpath' \| 'regexp' \| 'jsonpath' \| { v4: ...; v6: ... }` | `'raw'`      | Phương thức trích xuất IP từ response của `ipExtractionURL`                                         |
| `ipExtractionParam`  | `string \| { v4: string; v6: string }`                                 | `''`         | Tham số dùng để trích xuất IP, phụ thuộc vào `ipExtractionMethod`                                  |

#### Phương thức trích xuất IP

| Phương thức    | Mô tả                                                      | Ví dụ `ipExtractionParam` |
| -------------- | ---------------------------------------------------------- | ------------------------- |
| `'raw'`        | Lấy toàn bộ nội dung response làm IP                        | (không cần)               |
| `'xpath'`      | Trích xuất IP bằng biểu thức XPath                          | `'/html/body/ip'`         |
| `'regexp'`     | Trích xuất IP bằng biểu thức chính quy                       | `'\\d+\\.\\d+\\.\\d+\\.\\d+'` |
| `'jsonpath'`   | Trích xuất IP bằng JSONPath                                 | `'$.ip'`                  |

#### Cấu hình riêng cho IPv4 và IPv6

Tất cả các tuỳ chọn IP đều hỗ trợ cấu hình riêng cho IPv4 và IPv6:

```ts
engine.useProxy(proxyUrl, {
  detectExternalIP: { v4: true, v6: false },
  ipExtractionURL: {
    v4: 'https://api4.ipify.org',
    v6: 'https://api6.ipify.org',
  },
  ipExtractionMethod: {
    v4: 'raw',
    v6: 'regexp',
  },
  ipExtractionParam: {
    v4: '',
    v6: '\\d+:\\d+:\\d+:\\d+:\\d+:\\d+:\\d+:\\d+',
  },
});
```

### Tra cứu thông tin địa lý

Engine cần biết vị trí địa lý của proxy để đồng bộ timezone và geolocation. Có hai phương thức tra cứu:

```ts
engine.useProxy(proxyUrl, {
  ipInfoMethod: 'ip-api.com',
  ipInfoKey: 'your-api-key',
});
```

| Thuộc tính    | Kiểu                            | Mặc định     | Mô tả                                                                                |
| ------------- | ------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `ipInfoMethod`| `'database' \| 'ip-api.com'`    | `'database'` | `'database'`: dùng database nội bộ (nhanh, kém chính xác). `'ip-api.com'`: service bên ngoài |
| `ipInfoKey`   | `string`                        | `''`         | API key của ip-api.com (bản trả phí). Chỉ dùng khi `ipInfoMethod` là `'ip-api.com'`    |

**Lưu ý**: ip-api.com bản miễn phí giới hạn 45 request/IP. Dùng bản trả phí (có API key) để không bị giới hạn.

### Tunneling và giao thức

```ts
engine.useProxy(proxyUrl, {
  enableTunneling: true,
  enableQUIC: false,
});
```

| Thuộc tính        | Kiểu      | Mặc định | Mô tả                                                                      |
| ----------------- | --------- | -------- | -------------------------------------------------------------------------- |
| `enableTunneling` | `boolean` | `true`   | Bật/tắt tunneling tích hợp. Tắt nếu đã có VPN hoặc muốn kết nối trực tiếp    |
| `enableQUIC`      | `boolean` | `false`  | Bật giao thức QUIC (UDP). **Chỉ bật nếu proxy server hỗ trợ UDP**           |

### DNS

```ts
engine.useProxy(proxyUrl, {
  dnsMode: 'custom-direct',
  dnsIP: '1.1.1.1',
});
```

| Thuộc tính | Kiểu                                                 | Mặc định         | Mô tả                                                                                     |
| ---------- | ---------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `dnsMode`  | `'system-proxy' \| 'custom-proxy' \| 'custom-direct'`| `'system-proxy'` | Chế độ phân giải DNS                                                                       |
| `dnsIP`    | `string`                                             | `'1.1.1.1'`      | Địa chỉ IP DNS server. Chỉ có hiệu lực khi `dnsMode` là `'custom-proxy'` hoặc `'custom-direct'` |

#### Chế độ DNS chi tiết

| Chế độ           | Cách hoạt động                                                                              | Khi nào dùng                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `'system-proxy'` | Dùng DNS hệ thống. Hostname gửi đến proxy để phân giải                                        | Mặc định, phù hợp hầu hết trường hợp                             |
| `'custom-proxy'` | Dùng DNS tùy chỉnh của Chrome. Truy vấn DNS **qua proxy** (proxy phải hỗ trợ UDP)            | Khi muốn DNS request cũng đi qua proxy                           |
| `'custom-direct'`| Dùng DNS tùy chỉnh của Chrome. Phân giải DNS **cục bộ**, traffic còn lại qua proxy           | Khi muốn dùng DNS riêng (như 1.1.1.1) nhưng traffic qua proxy    |

**Khuyến nghị**: Dùng `'custom-direct'` khi cần DNS server tuỳ chỉnh (Cloudflare, Google DNS...) để tránh DNS leak.

---

## Ví dụ cấu hình proxy

### Cấu hình cơ bản cho proxy dân cư (residential proxy)

```ts
engine.useProxy('http://customer-user:pass@pr.oxylabs.io:7777', {
  changeTimezone: true,
  changeBrowserLanguage: true,
  changeWebRTC: 'replace',
  dnsMode: 'custom-direct',
  dnsIP: '8.8.8.8',
});
```

### Cấu hình proxy SOCKS5

```ts
engine.useProxy('socks5://user:pass@192.168.1.100:1080', {
  changeWebRTC: 'replace',
  enableTunneling: true,
});
```

### Cấu hình không dùng proxy (VPN)

```ts
engine.useProxy('http://user:pass@localhost:8080', {
  enableTunneling: false,
  changeWebRTC: 'disable',
});
```

### Cấu hình trích xuất IP với JSONPath

```ts
engine.useProxy('http://user:pass@proxy:8080', {
  ipExtractionURL: 'https://httpbin.org/ip',
  ipExtractionMethod: 'jsonpath',
  ipExtractionParam: '$.origin',
});
```

### Cấu hình riêng IPv4 và IPv6

```ts
engine.useProxy('http://user:pass@proxy:8080', {
  changeWebRTC: 'replace',
  publicIPv4: 'auto',
  publicIPv6: 'disable',
  detectExternalIP: { v4: true, v6: false },
  ipExtractionURL: { v4: 'https://api4.ipify.org' },
});
```

### Kiểm tra WebRTC leak

```ts
engine.useProxy(proxyUrl, {
  changeWebRTC: 'replace',
  publicIPv4: 'auto',
  privateIPv4: 'disable',
  privateIPv6: 'disable',
});
```

Kiểm tra kết quả tại `https://browserleaks.com/webrtc` -- IP hiển thị phải là IP của proxy, không phải IP thật của bạn.

---

## Lưu ý quan trọng

- **Luôn dùng `changeWebRTC: 'replace'`**: Đây là cách duy nhất để ngăn WebRTC leak IP thật. `'disable'` cũng an toàn nhưng một số website có thể phát hiện WebRTC bị tắt.
- **Bật tunneling cho proxy**: `enableTunneling: true` (mặc định) là bắt buộc để proxy hoạt động. Chỉ tắt khi bạn đã có VPN.
- **QUIC cần proxy hỗ trợ UDP**: Không phải proxy nào cũng hỗ trợ UDP. Nếu bật `enableQUIC` mà proxy không hỗ trợ, kết nối sẽ lỗi.
- **ip-api.com có giới hạn**: Bản free giới hạn 45 request/IP. Nếu bạn dùng nhiều browser với cùng IP, hãy dùng `'database'` hoặc mua API key.
- **DNS leak**: Dùng `dnsMode: 'custom-direct'` với DNS server tuỳ chỉnh để tránh DNS leak qua DNS hệ thống mặc định.
