# Product: <tên tính năng>

> **Version:** 1.0 | **Cập nhật lần cuối:** YYYY-MM-DD

## Mô tả (cho người dùng)
Tính năng này giải quyết vấn đề gì của người dùng, dùng như thế nào một cách tổng quan.  
Ví dụ: "Tính năng fingerprint cho phép developer gắn fingerprint thật vào browser Chromium, giúp bypass bot detection mà không cần cấu hình thủ công từng tham số."

## Yêu cầu hệ thống
- **Playwright Core** >= 1.60 (peer dependency)
- **Hệ điều hành:** Windows 10/11 (64-bit), macOS 12+, Ubuntu 20.04+
- **Node.js** >= 18

## Cách sử dụng (từng bước)
1. Cài đặt package: `npm install @your-org/fingerprint-injector`
2. Fetch fingerprint từ service: `const fp = await fetchFingerprint()`
3. Gọi `chromium.useFingerprint(fp)`
4. Gọi `chromium.useProxy(proxyUrl)` nếu cần đồng bộ timezone, geolocation.
5. Gọi `chromium.launch()` để khởi động browser.
6. Gọi `chromium.newContext()` để tạo Playwright context như bình thường.

## Ví dụ code hoàn chỉnh
```ts
import { chromium } from '@your-org/fingerprint-injector';

(async () => {
  const fp = { webgl: { noise: 0.01 }, canvas: { type: 'noise' } };
  const proxy = 'http://user:pass@proxy.example.com:8080';

  const browser = await chromium.launch({ headless: false });
  await browser.useFingerprint(fp);
  await browser.useProxy(proxy);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://example.com');
})();
```

## Hành vi chi tiết
- Nếu `useProxy` được gọi trước `useFingerprint`, proxy config được ưu tiên khi có xung đột (ví dụ timezone).
- `launch()` chỉ được gọi một lần – gọi lần thứ hai sẽ throw `AlreadyLaunchedError`.
- Nếu không gọi `useFingerprint` trước `launch()`, browser chạy với fingerprint mặc định (không injection).

## Giới hạn và điều kiện
- Chỉ hỗ trợ Chromium-based browsers (Chrome, Edge, Brave). Không hỗ trợ Firefox.
- WebGL noise chỉ hoạt động khi GPU acceleration được bật.
- Tính năng này không thay đổi `navigator.plugins` hay `navigator.languages`.

## Xử lý lỗi thường gặp (FAQ / Troubleshooting)
| Vấn đề | Nguyên nhân thường gặp | Giải pháp |
|--------|------------------------|------------|
| `LaunchError: Engine timeout` | Engine chưa được tải hoặc firewall chặn CDP | Kiểm tra kết nối mạng, tăng timeout trong config. |
| `PluginError: WebGL not supported` | Browser cũ hoặc chạy trong môi trường headless không GPU | Cập nhật browser hoặc bật software rendering. |

## Tài liệu kỹ thuật liên quan (cho developer nâng cao)
- Spec: `docs/specs/webgl-noise.spec.md`
- Design: `docs/designs/webgl-noise.design.md`
- Theo dõi tiến độ: [`TRACKING.md`](../TRACKING.md)
