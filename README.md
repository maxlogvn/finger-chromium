<p align="center">
  <h1 align="center">FINGERPRINT-CHROMIUM</h1>
</p>

<p align="center">
  <strong>Trình điều khiển Chromium chống bot detection dành cho Playwright.</strong><br>
  Inject fingerprint thiết bị thật ở tầng C/C++ — đồng bộ proxy — quản lý profile bền vững.
</p>

---

## Dự án này là gì?

`fingerprint-chromium-engine` là một engine nhúng bên dưới <strong>Playwright</strong>, biến Chromium thông thường thành một trình duyệt <strong>không thể bị phát hiện</strong> bởi các hệ thống chống bot hiện đại (Cloudflare, DataDome, Akamai, Imperva...).

Thay vì can thiệp vào JavaScript để giả mạo fingerprint như các thư viện stealth phổ biến, engine này <strong>inject fingerprint trực tiếp vào bộ nhớ trình duyệt ở tầng C/C++</strong> trước khi JavaScript được khởi tạo. Điều này có nghĩa mọi API của trình duyệt — từ `navigator`, `WebGL`, `Canvas`, `AudioContext` đến `WebRTC` — đều trả về dữ liệu khớp với fingerprint gốc mà không để lại bất kỳ dấu vết override nào.



## Tính năng

- **Fingerprint thật** — Inject fingerprint thu thập từ thiết bị thực tế ở tầng C/C++ trước khi browser khởi động, không để lại dấu vết override ở JS layer.
- **Proxy đồng bộ** — Tự động đồng bộ timezone, geolocation, WebRTC, DNS theo proxy.
- **Profile bền vững** — Tự động lưu cookie, localStorage, session giữa các phiên, tránh corrupt dữ liệu gốc.
- **PerfectCanvas** — Render canvas chính xác theo fingerprint thật, tránh phát hiện bởi canvas fingerprinting.
- **Nhiễu WebGL/Audio/Canvas** — Làm nhiễu dữ liệu đồ họa và âm thanh để che giấu thông tin phần cứng thật.
- **Tùy chỉnh launcher** — Hỗ trợ Playwright launcher tùy chỉnh qua `useLauncher()`.
- **Chỉ Windows** — Hoạt động trên Windows 32-bit và 64-bit.

> Xem thêm: [docs/fingerprint.md](docs/fingerprint.md), [docs/proxy.md](docs/proxy.md), [docs/profile.md](docs/profile.md)

## Cài đặt

### Yêu cầu

- **Node.js** >= 18
- **playwright-core** >= 1.60 (peer dependency)
- **Windows** 10/11 (32-bit hoặc 64-bit)

### Các bước

```bash
npm install github:maxlogvn/finger-chromium
npm install playwright-core
npx playwright install chromium
```

Đặt private key qua biến môi trường:

```bash
set BABLOSOFT_KEY=your-private-key-here
```

> Xem hướng dẫn chi tiết: [docs/getting-started.md](docs/getting-started.md)

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

> **Bắt đầu từ đây** — [docs/getting-started.md](docs/getting-started.md)

### Gắn fingerprint

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const fp = await BrowserEngine.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
  timeLimit: '30 days',
});

const engine = new BrowserEngine();
engine.useFingerprint(fp, { safeWebGL: true });

const browser = engine.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://example.com');
await browser.close();
```

> Xem thêm: [docs/fingerprint.md](docs/fingerprint.md) — hướng dẫn đầy đủ về cấu hình fingerprint.

### Thêm proxy

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();
engine.useFingerprint(fp);
engine.useProxy('http://user:pass@proxy:8080', {
  changeTimezone: true,
  changeWebRTC: 'replace',
});

const browser = engine.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://example.com');
await browser.close();
```

> Xem thêm: [docs/proxy.md](docs/proxy.md) — hướng dẫn đầy đủ về cấu hình proxy.

### Tải lại profile

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();
engine.useProfile('./profiles/user_01', {
  loadFingerprint: true,
  loadProxy: true,
});

const browser = engine.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://example.com');
await browser.close();
```

> Xem thêm: [docs/profile.md](docs/profile.md) — hướng dẫn đầy đủ về quản lý profile.

## API

### `BrowserEngine.newFingerprint(options?)`

Static method — lấy fingerprint từ service. Không cần tạo instance BrowserEngine.

- `options.tags` — Lọc theo thiết bị, OS, trình duyệt. VD: `['Chrome', 'Desktop', 'Windows 10']`.
- `options.timeLimit` — `'*' | '15 days' | '30 days' | '60 days'`.
- `options.minWidth / maxWidth` — Lọc theo chiều rộng màn hình.
- `options.minHeight / maxHeight` — Lọc theo chiều cao màn hình.
- `options.minBrowserVersion / maxBrowserVersion` — Lọc theo phiên bản trình duyệt. Dùng `'current'` để khớp với bản đang cài.
- `options.perfectCanvasRequest` — PerfectCanvas request từ CanvasInspector.
- `options.dynamicPerfectCanvas` — Render PerfectCanvas động (mặc định `true`).

### `engine.useFingerprint(data, options?)`

Gắn fingerprint cho trình duyệt. Phải gọi trước `launch()`.

- `data` — Chuỗi JSON fingerprint từ `newFingerprint()`.
- `options.usePerfectCanvas` — Render canvas chính xác theo fingerprint (mặc định `true`).
- `options.safeWebGL` — Nhiễu WebGL, che giấu thông tin GPU (mặc định `true`).
- `options.safeCanvas` — Nhiễu Canvas 2D (mặc định `true`).
- `options.safeAudio` — Nhiễu Web Audio API (mặc định `true`).
- `options.safeBattery` — Giả lập Battery API (mặc định `true`).
- `options.safeElementSize` — Che giấu tọa độ DOM (mặc định `false`).
- `options.useFontPack` — Đồng bộ font với fingerprint (mặc định `true`).
- `options.emulateDeviceScaleFactor` — Giả lập màn hình Retina (mặc định `true`).
- `options.emulateSensorAPI` — Giả lập Sensor API (mặc định `true`).

### `engine.useProxy(data, options?)`

Định tuyến traffic qua proxy. Phải gọi trước `launch()`.

- `data` — Proxy URL: `protocol://user:pass@host:port`.
- `options.changeTimezone` — Đổi múi giờ theo proxy (mặc định `true`).
- `options.changeGeolocation` — Đổi vị trí địa lý (mặc định `false`).
- `options.changeBrowserLanguage` — Đổi ngôn ngữ trình duyệt (mặc định `true`).
- `options.changeWebRTC` — `'enable' | 'disable' | 'replace'` (mặc định `'replace'`).
- `options.enableTunneling` — Bật/tắt tunneling (mặc định `true`).
- `options.dnsMode` — `'system-proxy' | 'custom-proxy' | 'custom-direct'` (mặc định `'system-proxy'`).
- `options.dnsIP` — IP DNS server cho chế độ custom (mặc định `'1.1.1.1'`).
- `options.enableQUIC` — Bật QUIC nếu proxy hỗ trợ UDP (mặc định `false`).

### `engine.useProfile(dirPath, options?)`

Liên kết thư mục profile. Phải gọi trước `launch()`.

- `dirPath` — Đường dẫn thư mục lưu cookie, localStorage.
- `options.loadProxy` — Tự động load proxy từ profile cũ (mặc định `true`).
- `options.loadFingerprint` — Tự động load fingerprint từ profile cũ (mặc định `true`).

### `engine.useLauncher(launcher, connector?)`

Thay thế launcher Playwright mặc định bằng bản tùy chỉnh.

### `engine.launch(options?)`

Khởi tạo engine với toàn bộ cấu hình. Chỉ gọi một lần cho mỗi instance.

- `options` — Tùy chọn `launchPersistentContext` của Playwright. Mặc định: `{ headless: false, hasTouch: true }`.

### `engine.newContext(options?)`

Tạo Playwright `BrowserContext`. Phải gọi `launch()` trước.

Trả về `Promise<BrowserContext>`.

### `engine.close(saveDataPath?)`

Đóng trình duyệt, giải phóng tài nguyên, lưu profile.

- `saveDataPath` — Ghi đè đường dẫn lưu profile.

> Xem thêm: [docs/api.md](docs/api.md) — tham khảo API đầy đủ. [docs/error-handling.md](docs/error-handling.md) — hướng dẫn xử lý lỗi. [docs/advanced.md](docs/advanced.md) — hướng dẫn nâng cao.

## Tài liệu

Xem chi tiết trong thư mục `docs/`:

### Hướng dẫn sử dụng

| Tài liệu                                             | Nội dung                                              |
| ---------------------------------------------------- | ----------------------------------------------------- |
| [docs/getting-started.md](docs/getting-started.md)   | Hướng dẫn cài đặt và sử dụng cơ bản                    |
| [docs/fingerprint.md](docs/fingerprint.md)           | Hướng dẫn chi tiết về cấu hình fingerprint              |
| [docs/proxy.md](docs/proxy.md)                       | Hướng dẫn chi tiết về cấu hình proxy                    |
| [docs/profile.md](docs/profile.md)                   | Hướng dẫn quản lý profile                              |

### Tham khảo

| Tài liệu                                             | Nội dung                                              |
| ---------------------------------------------------- | ----------------------------------------------------- |
| [docs/api.md](docs/api.md)                           | Tham khảo API đầy đủ với tất cả type và tùy chọn       |
| [docs/error-handling.md](docs/error-handling.md)     | Hướng dẫn xử lý lỗi và khắc phục                        |
| [docs/advanced.md](docs/advanced.md)                 | Hướng dẫn nâng cao (debug log, đồng thời, hiệu năng)    |
| [docs/faq.md](docs/faq.md)                           | Câu hỏi thường gặp                                     |

### Phát triển

| Tài liệu                             | Nội dung                                              |
| ------------------------------------ | ----------------------------------------------------- |
| [CONVENTIONS.md](CONVENTIONS.md)     | Quy ước code                                            |
| [STACK.md](STACK.md)                 | Công nghệ sử dụng và lý do chọn                          |

## Phát triển

```bash
npm run lint       # Kiểm tra code style
npm run typecheck  # Kiểm tra TypeScript
npm run build      # Bundle ESM + CJS
npm test           # Playwright test (E2E với browser thật)
```

## License

MIT
