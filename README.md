<div align="center">

# FINGERPRINT-CHROMIUM

**Trình điều khiển Chromium chống bot detection dành cho Playwright.**

Inject fingerprint thiết bị thật ở tầng C/C++ · Đồng bộ proxy tự động · Quản lý profile bền vững

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](#)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-lightgrey.svg)](#)
[![Version](https://img.shields.io/badge/version-1.0.0-blueviolet.svg)](CHANGELOG.md)

</div>

---

## Tổng quan

`fingerprint-chromium-engine` là engine nhúng bên dưới Playwright, biến Chromium thành một trình duyệt không bị phát hiện bởi các hệ thống chống bot hiện đại như Cloudflare, DataDome, Akamai, và Imperva.

Khác với các thư viện stealth thông thường can thiệp vào JavaScript, engine này **inject fingerprint trực tiếp vào bộ nhớ trình duyệt ở tầng C/C++** trước khi JavaScript được khởi tạo. Kết quả là mọi API của trình duyệt — `navigator`, `WebGL`, `Canvas`, `AudioContext`, `WebRTC` — đều trả về dữ liệu khớp với fingerprint gốc, không để lại bất kỳ dấu vết override nào.

---

## Tính năng

- **[Fingerprint thật](docs/fingerprint.md)** — Inject từ thiết bị thực tế ở tầng C/C++, không để lại vết override JS.
- **[Fingerprint Storage](CHANGELOG.md#unreleased)** — Lưu trữ và quản lý fingerprint cục bộ, cache theo tags, API CRUD.
- **[Proxy đồng bộ](docs/proxy.md)** — Tự động đồng bộ timezone, geolocation, WebRTC, DNS theo proxy.
- **[Profile bền vững](docs/profile.md)** — Lưu cookie, localStorage, session giữa các phiên, tránh corrupt dữ liệu.
- **[PerfectCanvas](docs/fingerprint.md#perfectcanvas)** — Render canvas chính xác theo fingerprint thật, tránh canvas fingerprinting.
- **[Chỉ Windows](docs/linux-feasibility-report.md)** — Hỗ trợ Windows 10/11 (32-bit và 64-bit).

---

## Yêu cầu hệ thống

- Node.js >= 18.0.0
- Playwright >= 1.60.0
- Windows 10/11 (32-bit hoặc 64-bit)

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
const engine = new BrowserEngine();
const fingerprint = engine.newFingerprint();
const browser = engine.useFingerprint(fingerprint).launch();
```

Xem thêm: [docs/fingerprint.md](docs/fingerprint.md)

### Thêm proxy

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';
const engine = new BrowserEngine();
const fingerprint = engine.newFingerprint();
const browser = engine.useFingerprint(fingerprint).useProxy('http://user:pass@proxy:8080').launch()
```

Xem thêm: [docs/proxy.md](docs/proxy.md)

### Tải lại profile

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();
const browser = engine.useProfile('./profiles/user_01').launch();
```

Xem thêm: [docs/profile.md](docs/profile.md)


## Nhật ký thay đổi


```
**Tính năng mới**

- **Fluent API**: Hỗ trợ method chaining `new BrowserEngine().useFingerprint().useProxy().useProfile().launch()`.
- **PerfectCanvas**: Render canvas khớp chính xác với fingerprint, tránh bị phát hiện qua canvas fingerprinting.
- **Viewport chính xác**: Tự động hiệu chỉnh kích thước cửa sổ, fallback sang `page.setViewportSize()` trong headless mode.

**Thay đổi**

- `BrowserEngine` thay thế `Chromium` làm class chính. `Chromium` vẫn hoạt động nhưng đã được đánh dấu deprecated.
- Engine process (`FastExecuteScript.exe`) được tái sử dụng giữa các phiên thay vì khởi động lại mỗi lần.

**Sửa lỗi**

- File `.zip` bị hỏng khi download thất bại giữa chừng.
- Engine download chuyển sang HTTPS với fallback.
- `quit()` dọn dẹp toàn bộ tiến trình và tài nguyên sau khi đóng browser.
- PCAP server không tự thoát sau khi `quit()` được gọi.
```

Xem toàn bộ lịch sử: [CHANGELOG.md](CHANGELOG.md)

---

## Tài liệu tham khảo

- [CHANGELOG.md](CHANGELOG.md) — Lịch sử phiên bản theo Semantic Versioning.
- [docs/api.md](docs/api.md) — Toàn bộ type, method, và tùy chọn.
- [docs/error-handling.md](docs/error-handling.md) — Xử lý lỗi: MissingKey, InvalidEngine, Timeout...
- [docs/advanced.md](docs/advanced.md) — Debug log, chạy đồng thời, quản lý bộ nhớ.
- [docs/faq.md](docs/faq.md) — Câu hỏi thường gặp.
- [docs/linux-feasibility-report.md](docs/linux-feasibility-report.md) — Báo cáo đánh giá tính khả thi của phiên bản Linux.

---

## Phát triển

```bash
npm run lint       # Kiểm tra code style (ESLint)
npm run typecheck  # Kiểm tra TypeScript
npm run build      # Bundle ESM + CJS
npm test           # Playwright E2E test
```

Xem thêm [CONVENTIONS.md](CONVENTIONS.md) , [STACK.md](STACK.md) , [ARCHITECTURE.md](ARCHITECTURE.md).

---

## License

[MIT](LICENSE)