# Design: Hệ thống kiểu (Type System)

## Vấn đề cần giải quyết

Thư viện này cần giao tiếp với nhiều thành phần khác nhau: engine binary từ bablosoft, Playwright, proxy server, và fingerprint data. Mỗi thành phần có cấu trúc dữ liệu riêng:

- **Fingerprint:** một object JSON phức tạp chứa thông phần cứng, màn hình, canvas, WebGL, audio... và các tùy chọn để bật/tắt từng kỹ thuật giả lập.
- **Proxy:** URL kết nối proxy, kèm theo vô số tùy chọn về DNS, WebRTC, timezone, geolocation, IP detection...
- **Profile:** đường dẫn thư mục profile, tùy chọn load lại proxy/fingerprint từ lần chạy trước.
- **Fetch:** bộ lọc để tìm fingerprint phù hợp từ service của bablosoft.
- **Public API:** interface cho người dùng -- cần rõ ràng, có JSDoc đầy đủ, kiểu chặt chẽ.

Nếu không có hệ thống kiểu rõ ràng, sẽ dễ xảy ra:
- Nhầm lẫn giữa các option (ví dụ: `changeWebRTC` nhận `'enable' | 'disable' | 'replace'` chứ không phải boolean).
- Thiếu type check khi gọi API (ví dụ: quên truyền `data` string cho `useFingerprint`).
- Không biết một field có mặc định là gì.
- IDE không gợi ý được property names.

## Giải pháp chọn

Tách riêng 5 file type trong `src/types/`, mỗi file phụ trách một nhóm dữ liệu:

### 1. `PWChromium.ts` -- Interface Public API

Đây là interface mà người dùng chính thức tương tác. Nó định nghĩa tất cả method có sẵn trên singleton `Chromium`: `useFingerprint`, `useProxy`, `useProfile`, `usePrivateKey`, `launch`, `newContext`, `newFingerprint`, `quit`, `repackChromium`.

**Tại sao dùng interface thay vì class?** Interface cho phép nhiều implementation khác nhau (VD: một bản mock cho test, một bản production). Nó cũng dễ dùng hơn khi publish dưới dạng `.d.ts`.

**Tại sao `object` type cho engine property?** `engine` là instance gốc của plugin. Dùng `object` thay vì type cụ thể để tránh circular dependency giữa các module và cho phép internal implementation thay đổi mà không ảnh hưởng đến public API.

### 2. `fingerprint.ts` -- FingerprintOptions

Chứa tất cả tùy chọn cho việc inject fingerprint.

Các quyết định thiết kế:
- **`usePerfectCanvas` mặc định `true`:** PerfectCanvas là cách chính xác nhất để giả lập Canvas fingerprint. Nó thay thế toàn bộ dữ liệu canvas bằng dữ liệu từ fingerprint thật. Nếu fingerprint không có dữ liệu PerfectCanvas, option này sẽ không có tác dụng.
- **`safeCanvas` mặc định `true`:** Thêm nhiễu vào Canvas 2D. Đây là lớp bảo vệ thứ hai sau PerfectCanvas. Khi cả hai đều bật, PerfectCanvas được ưu tiên.
- **`safeWebGL` mặc định `true`:** Che giấu thông tin GPU (tên hãng, renderer). WebGL fingerprinting là kỹ thuật phổ biến để theo dõi.
- **`safeElementSize` mặc định `false`:** Can thiệp vào ClientRects có thể làm hỏng layout của một số website. Để `false` là an toàn nhất.
- **`emulateSensorAPI` và `emulateDeviceScaleFactor` mặc định `true`:** Giả lập càng nhiều API càng làm fingerprint trở nên tự nhiên hơn.

### 3. `proxy.ts` -- ProxyOptions

Chứa tất cả tùy chọn cho proxy.

Các quyết định thiết kế:
- **`changeWebRTC` dùng string union (`'enable' | 'disable' | 'replace'`) thay vì boolean:** Vì WebRTC có 3 trạng thái, không thể dùng boolean.
- **`dnsMode` cũng dùng string union (`'system-proxy' | 'custom-proxy' | 'custom-direct'`):** 3 chế độ DNS khác nhau, mỗi chế độ có hành vi riêng.
- **IP detection options dùng object notation cho v4/v6:** IP Extraction Method, Param, URL và Detect External IP có thể nhận giá trị chung cho cả IPv4 và IPv6, hoặc riêng cho từng loại (dùng object `{ v4: ..., v6: ... }`). Đây là lựa chọn linh hoạt nhất.
- **`publicIPv4` và `publicIPv6` kiểu `PublicIPReplacement`:** Cho phép 3 giá trị: `'disable'` (không hiển thị), `'auto'` (tự động lấy từ proxy), hoặc một IP string cụ thể.
- **`ipInfoMethod` chỉ hỗ trợ `'database'` và `'ip-api.com'`:** Engine binary hỗ trợ thêm một số method không dùng, nhưng 2 cái này là đủ cho hầu hết trường hợp.

### 4. `profile.ts` -- ProfileOptions

Đơn giản nhất -- chỉ có 2 boolean option: `loadProxy` và `loadFingerprint`. Cả hai đều mặc định `true` vì mục đích của profile là giữ lại trạng thái.

### 5. `fetch.ts` -- FetchOptions, Tag, Time

Bộ lọc để gọi API fingerprint service.

- **`Tag` và `Time` là type union:** Giới hạn giá trị hợp lệ ngay tại type level, tránh typo.
- **`FetchOptions` chứa các bộ lọc:** tags, timeLimit, kích thước màn hình, phiên bản browser, PerfectCanvas request, custom server.
- **`minBrowserVersion` và `maxBrowserVersion` nhận `'current'` hoặc number:** Dùng `'current'` để tự động khớp với phiên bản Chrome hiện tại -- tiện lợi khi viết script.

## Cấu trúc phụ thuộc

```
PWChromium.ts (interface chính)
  ├── tham chiếu PluginLaunchOptions từ adapter
  │
  ├── useFingerprint(data, options) ---> FingerprintOptions (fingerprint.ts)
  ├── useProxy(data, options)        ---> ProxyOptions (proxy.ts)
  ├── useProfile(dir, options)       ---> ProfileOptions (profile.ts)
  └── newFingerprint(options)        ---> FetchOptions (fetch.ts)
```

Không có type nào phụ thuộc lẫn nhau -- mỗi file độc lập, dễ maintain.

---
