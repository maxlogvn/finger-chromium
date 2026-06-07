<div align="center">

# FINGERPRINT-CHROMIUM

**Trình điều khiển Chromium chống bot detection dành cho Playwright.**

Inject fingerprint thiết bị thật ở tầng C/C++ · Đồng bộ proxy tự động · Quản lý profile bền vững

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](#)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-lightgrey.svg)](#)

</div>

---

## Tổng quan

`fingerprint-chromium-engine` là engine nhúng bên dưới Playwright, biến Chromium thành một trình duyệt không bị phát hiện bởi các hệ thống chống bot hiện đại như Cloudflare, DataDome, Akamai, và Imperva.

Khác với các thư viện stealth thông thường can thiệp vào JavaScript, engine này **inject fingerprint trực tiếp vào bộ nhớ trình duyệt ở tầng C/C++** trước khi JavaScript được khởi tạo. Kết quả là mọi API của trình duyệt — `navigator`, `WebGL`, `Canvas`, `AudioContext`, `WebRTC` — đều trả về dữ liệu khớp với fingerprint gốc, không để lại bất kỳ dấu vết override nào.

---

## Tính năng

| Tính năng | Mô tả |
| --- | --- |
| **Fingerprint thật** | Inject từ thiết bị thực tế ở tầng C/C++, không để lại vết override JS. |
| **Proxy đồng bộ** | Tự động đồng bộ timezone, geolocation, WebRTC, DNS theo proxy. |
| **Profile bền vững** | Lưu cookie, localStorage, session giữa các phiên, tránh corrupt dữ liệu. |
| **PerfectCanvas** | Render canvas chính xác theo fingerprint thật, tránh canvas fingerprinting. |
| **Nhiễu phần cứng** | Làm nhiễu WebGL, Audio, Canvas để che giấu thông tin phần cứng thật. |
| **Chỉ Windows** | Hỗ trợ Windows 10/11 (32-bit và 64-bit). |

---

## Yêu cầu hệ thống

| Thành phần | Yêu cầu |
| --- | --- |
| Node.js | >= 18.0.0 |
| Playwright | >= 1.60.0 |
| Hệ điều hành | Windows 10/11 (32-bit hoặc 64-bit) |

---

## Cài đặt

```bash
npm install playwright-core
npx playwright install chromium
npm install github:maxlogvn/finger-chromium
```

---

## Sử dụng nhanh

### Khởi động tối thiểu

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();
const browser = engine.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://example.com');
await browser.close();
```

### Gắn fingerprint

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const fp = await BrowserEngine.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
  timeLimit: '30 days',
});

const browser = new BrowserEngine()
  .useFingerprint(fp, { safeWebGL: true })
  .launch();
```

### Thêm proxy

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const browser = new BrowserEngine()
  .useFingerprint(fp)
  .useProxy('http://user:pass@proxy:8080', {
    changeTimezone: true,
    changeWebRTC: 'replace',
  })
  .launch();
```

### Tải lại profile

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const browser = new BrowserEngine()
  .useProfile('./profiles/user_01', {
    loadFingerprint: true,
    loadProxy: true,
  })
  .launch();
```

---

## Tài liệu

### Hướng dẫn

| Tài liệu | Mô tả |
| --- | --- |
| [docs/getting-started.md](docs/getting-started.md) | Cài đặt và sử dụng cơ bản từ đầu đến cuối. |
| [docs/fingerprint.md](docs/fingerprint.md) | Cấu hình fingerprint: PerfectCanvas, nhiễu, FontPack. |
| [docs/proxy.md](docs/proxy.md) | Cấu hình proxy: timezone, geolocation, WebRTC, DNS. |
| [docs/profile.md](docs/profile.md) | Quản lý profile: lưu/tải cookie, session, dữ liệu trình duyệt. |

### Tham khảo

| Tài liệu | Mô tả |
| --- | --- |
| [docs/api.md](docs/api.md) | API đầy đủ với tất cả type, method, và tùy chọn. |
| [docs/error-handling.md](docs/error-handling.md) | Xử lý lỗi: MissingKey, InvalidEngine, Timeout... |
| [docs/advanced.md](docs/advanced.md) | Debug log, chạy đồng thời, quản lý bộ nhớ, hiệu năng. |
| [docs/faq.md](docs/faq.md) | Câu hỏi thường gặp về fingerprint, proxy, profile. |

---

## Phát triển

```bash
npm run lint       # Kiểm tra code style (ESLint)
npm run typecheck  # Kiểm tra TypeScript
npm run build      # Bundle ESM + CJS
npm test           # Playwright E2E test
```

Xem thêm [CONVENTIONS.md](CONVENTIONS.md) và [STACK.md](STACK.md).

---

## License

[MIT](LICENSE)