# Câu hỏi thường gặp

## Cài đặt và cấu hình

### Tôi cần cài đặt những gì?

Bạn cần Node.js >= 18, `playwright-core` >= 1.60, và Windows 10/11 (32/64-bit). Cài đặt:

```bash
npm install github:maxlogvn/finger-chromium
npm install playwright-core
npx playwright install chromium
```

### Biến môi trường BABLOSOFT_KEY là gì? Lấy ở đâu?

`BABLOSOFT_KEY` là private key để kết nối với service fingerprint của bablosoft. Bạn cần đăng ký tài khoản tại bablosoft để nhận key. Đặt key qua biến môi trường trước khi chạy code.

### Thư viện có hoạt động trên Linux/MacOS không?

Không. Thư viện chỉ hỗ trợ Windows 10/11 (32-bit và 64-bit) do engine C++ phụ thuộc vào Windows API.

---

## Fingerprint

### Tôi có thể dùng fingerprint tự tạo không?

Không. Fingerprint phải được lấy từ service của bablosoft thông qua `BrowserEngine.newFingerprint()`. Đây là fingerprint thu thập từ thiết bị thực, không phải fingerprint tổng hợp.

### Làm sao để biết fingerprint có hoạt động không?

Truy cập các website kiểm tra fingerprint như:
- `https://browserleaks.com/canvas` -- kiểm tra Canvas fingerprint.
- `https://browserleaks.com/webgl` -- kiểm tra WebGL fingerprint.
- `https://browserleaks.com/webrtc` -- kiểm tra WebRTC leak.
- `https://browserleaks.com/fonts` -- kiểm tra font list.
- `https://fingerprint.com/demo` -- kiểm tra fingerprint tổng hợp.

### Tại sao tôi nên dùng `minBrowserVersion: 'current'`?

Fingerprint thu thập từ các phiên bản trình duyệt khác nhau. Nếu fingerprint được thu thập từ Chrome 120 nhưng bạn chạy Chrome 125, các website có thể phát hiện sự không khớp. Dùng `'current'` để luôn lấy fingerprint có phiên bản khớp với Chromium trên máy bạn.

### PerfectCanvas là gì? Có bắt buộc không?

PerfectCanvas là công nghệ render canvas chính xác theo fingerprint thật, giúp vượt qua các bài kiểm tra canvas fingerprinting nâng cao của Cloudflare và các CDN khác. Không bắt buộc nhưng rất được khuyến nghị cho các website bảo mật cao.

Để dùng PerfectCanvas, bạn cần:
1. Cài CanvasInspector (công cụ của bablosoft).
2. Lấy `perfectCanvasRequest` cho website mục tiêu.
3. Truyền vào `newFingerprint({ perfectCanvasRequest: '...' })`.
4. Bật `usePerfectCanvas: true` trong `useFingerprint()`.

### Tôi có cần cài FontPack không?

Không bắt buộc. FontPack chỉ cần khi fingerprint mục tiêu có danh sách font nhiều hơn hệ thống của bạn. Nếu không cài, hệ thống chỉ dùng font có sẵn trên máy. Tải tại: `https://wiki.bablosoft.com/doku.php?id=fontpack`

---

## Proxy

### Tôi có cần proxy không?

Không bắt buộc. Nhưng nếu bạn muốn:
- Ẩn IP thật để tránh bị chặn theo IP.
- Giả lập vị trí địa lý khác.
- Dùng nhiều tài khoản từ các IP khác nhau.

Thì proxy là cần thiết.

### Proxy của tôi không hoạt động. Làm sao để debug?

```bash
# Bật debug log để xem chi tiết
set DEBUG=browser-with-fingerprints:*
node your-script.js
```

Kiểm tra:
1. Proxy URL đúng định dạng: `protocol://user:pass@host:port`.
2. Proxy server đang hoạt động (dùng `curl` hoặc `telnet` để kiểm tra).
3. `enableTunneling` đang là `true` (mặc định).
4. Firewall không chặn kết nối đến proxy.

### WebRTC vẫn leak IP thật của tôi. Làm sao để sửa?

Đảm bảo bạn đã đặt:
```ts
engine.useProxy(proxyUrl, {
  changeWebRTC: 'replace',
  publicIPv4: 'auto',
});
```

Kiểm tra tại `https://browserleaks.com/webrtc`. Nếu vẫn leak, thử `changeWebRTC: 'disable'`.

### Sự khác nhau giữa `'database'` và `'ip-api.com'` trong ipInfoMethod?

- `'database'`: Dùng database nội bộ để tra cứu vị trí từ IP. Nhanh, không giới hạn request, nhưng độ chính xác thấp hơn.
- `'ip-api.com'`: Gọi API bên ngoài để tra cứu. Chính xác hơn nhưng bản free giới hạn 45 request/IP. Cần API key cho bản không giới hạn.

### Khi nào tôi nên dùng `enableTunneling: false`?

Chỉ khi bạn đã có VPN hoặc đang kết nối mạng qua proxy hệ thống. Nếu bạn không dùng proxy, không cần quan tâm đến tuỳ chọn này.

---

## Profile

### Profile lưu những gì?

Profile lưu toàn bộ dữ liệu phiên của trình duyệt:
- Cookie và session.
- LocalStorage và SessionStorage.
- IndexedDB.
- Cache.
- Lịch sử duyệt web.
- Tiện ích mở rộng (nếu có).

### Tôi có thể copy profile sang máy khác không?

Có. Profile là thư mục thông thường trên ổ đĩa. Bạn có thể copy sang máy khác (cùng hệ điều hành) và dùng bình thường.

### Profile bị hỏng. Làm sao để khôi phục?

Không thể khôi phục nếu dữ liệu đã bị ghi đè hoặc hỏng. Luôn sao lưu profile quan trọng:

```bash
Copy-Item -Recurse .\profiles\user_01 .\backups\user_01_$(Get-Date -Format 'yyyyMMdd')
```

### Tôi có thể dùng chung profile cho nhiều phiên không?

Không. Nhiều phiên cùng ghi vào một thư mục profile sẽ gây hỏng dữ liệu. Mỗi phiên cần một thư mục profile riêng.

---

## Hiệu năng

### Engine chạy chậm. Làm sao để tăng tốc?

1. **Giảm nhiễu**: Tắt các tính năng không cần thiết:
   ```ts
   engine.useFingerprint(fp, {
     safeCanvas: false,
     safeAudio: false,
     safeWebGL: false,
     safeBattery: false,
     emulateDeviceScaleFactor: false,
   });
   ```

2. **Tắt PerfectCanvas nếu không cần**:
   ```ts
   engine.useFingerprint(fp, {
     usePerfectCanvas: false,
   });
   ```

3. **Dùng headless mode**:
   ```ts
   const browser = engine.launch({ headless: true });
   ```

4. **Dùng database nội bộ cho IP info** (mặc định):
   ```ts
   engine.useProxy(proxyUrl, {
     ipInfoMethod: 'database',
   });
   ```

### Tốn bao nhiêu RAM cho mỗi phiên?

Khoảng 200-500MB RAM cho mỗi phiên tuỳ thuộc vào số lượng tab và cấu hình. Headless mode dùng ít RAM hơn.

### Tôi có thể chạy bao nhiêu phiên cùng lúc?

Phụ thuộc vào RAM và CPU của máy. Với 16GB RAM, bạn có thể chạy 10-20 phiên đồng thời ở chế độ headless. Với GUI mode, con số này thấp hơn do render tốn tài nguyên.

---

## Lỗi thường gặp

### "MissingKeyError: Thiếu BABLOSOFT_KEY"

Chưa đặt biến môi trường `BABLOSOFT_KEY`. Xem [error-handling.md](error-handling.md#missingkeyerror) để biết cách khắc phục.

### "InvalidEngineError: Engine chưa được tải xuống"

Xoá thư mục `.tmp/browser/engine` và chạy lại. Xem [error-handling.md](error-handling.md#invalidengineerror).

### "launch() chỉ được gọi một lần"

Bạn đang gọi `launch()` hai lần trên cùng một instance. Mỗi instance chỉ được launch một lần. Tạo instance mới nếu cần khởi động lại.

### "Phải gọi launch() trước khi tạo context"

Bạn đang gọi `newContext()` trước `launch()`. Luôn gọi `launch()` trước.

### "Context đã được tạo. Gọi close() trước khi tạo mới"

Bạn có một context đang mở. Gọi `engine.close()` trước khi tạo context mới.

---

## Khác

### Tôi có thể dùng thư viện này với Puppeteer không?

Không. Thư viện chỉ hỗ trợ Playwright (`playwright-core`).

### Có hỗ trợ TypeScript không?

Có. Thư viện được viết bằng TypeScript và export đầy đủ type definitions (`.d.ts`).

### Tôi có thể đóng góp vào dự án không?

Có. Repository tại `https://github.com/maxlogvn/finger-chromium`. Xem [conventions.md](conventions.md) để biết quy ước code.

### Tôi cần hỗ trợ thêm. Liên hệ ở đâu?

Mở issue tại `https://github.com/maxlogvn/finger-chromium/issues` hoặc tham khảo wiki của bablosoft tại `https://wiki.bablosoft.com/`.
