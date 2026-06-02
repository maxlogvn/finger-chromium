# Product: <tên tính năng>

## Mô tả
Mô tả tính năng từ góc nhìn người dùng — nó làm gì, giải quyết vấn đề gì.
Ví dụ: "Tính năng fingerprint cho phép developer gắn fingerprint thật vào browser Chromium, giúp bypass bot detection mà không cần cấu hình thủ công từng tham số."

## Cách sử dụng
Mô tả các bước người dùng thực hiện để dùng tính năng này.
Ví dụ:
1. Gọi `chromium.useFingerprint(data)` với fingerprint đã fetch từ service.
2. Gọi `chromium.useProxy(proxyUrl)` để đồng bộ timezone, geolocation theo proxy.
3. Gọi `chromium.launch()` để khởi động browser.
4. Gọi `chromium.newContext()` để tạo Playwright BrowserContext.

## Hành vi chi tiết
Mô tả các trường hợp đặc biệt hoặc hành vi cần lưu ý.
Ví dụ:
- Nếu `useProxy` được gọi trước `useFingerprint`, proxy config được ưu tiên khi có xung đột.
- `launch()` chỉ được gọi một lần — gọi lần thứ hai sẽ throw.

## Giới hạn và điều kiện
Những ràng buộc người dùng cần biết.
Ví dụ:
- Yêu cầu Playwright Core >= 1.60 (peer dependency).
- Chỉ hỗ trợ Windows 32-bit và 64-bit.

## Tài liệu kỹ thuật liên quan
- Spec: `docs/specs/<tên>.spec.md`
- Design: `docs/designs/<tên>.design.md`