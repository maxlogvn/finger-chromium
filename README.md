<p align="center">
  <h1 align="center">FINGERPRINT-CHROMIUM</h1>
</p>

<p align="center">
  Trình điều khiển Fluent chống bot detection — inject fingerprint thiết bị thật, đồng bộ proxy, quản lý profile bền vững, dành cho Playwright.
</p>

<p align="center">
  <a href="#tinh-nang">Tính năng</a>
  &nbsp;|&nbsp;
  <a href="#cai-dat">Cài đặt</a>
  &nbsp;|&nbsp;
  <a href="#su-dung-nhanh">Sử dụng nhanh</a>
  &nbsp;|&nbsp;
  <a href="#api">API</a>
  &nbsp;|&nbsp;
  <a href="#bien-moi-truong">Biến môi trường</a>
  &nbsp;|&nbsp;
  <a href="#tai-lieu">Tài liệu</a>
  &nbsp;|&nbsp;
  <a href="#phat-trien">Phát triển</a>
</p>

---

## Tính năng

- **Fingerprint thật** — Inject fingerprint thu thập từ thiết bị thực tế ở tầng C/C++ trước khi browser khởi động, không để lại dấu vết override ở JS layer.
- **Proxy đồng bộ** — Tự động đồng bộ timezone, geolocation, WebRTC, DNS theo proxy.
- **Profile bền vững** — Tự động lưu cookie, localStorage, session giữa các phiên, tránh corrupt dữ liệu gốc.
- **PerfectCanvas** — Render canvas chính xác theo fingerprint thật, tránh phát hiện bởi canvas fingerprinting.
- **Nhiễu WebGL/Audio/Canvas** — Làm nhiễu dữ liệu đồ họa và âm thanh để che giấu thông tin phần cứng thật.
- **Tùy chỉnh launcher** — Hỗ trợ Playwright patch tùy chỉnh.
- **Chỉ Windows** — Hoạt động trên Windows 32-bit và 64-bit.

## Cài đặt

### Yêu cầu

- **Node.js** >= 18
- **playwright-core** >= 1.60 (peer dependency)
- **Windows** 10/11 (32-bit hoặc 64-bit)

### Các bước

```bash
npm npm install github:maxlogvn/finger-chromium
npm install playwright-core
npx playwright install chromium
```

## Sử dụng nhanh

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

async function main() {
  // Lấy fingerprint từ service
  const browser = new BrowserEngine();
  const fingerprint = await browser.newFingerprint({
    tags: ['Chrome', 'Desktop', 'Windows 10'],
    timeLimit: '30 days',
  });

  // Cấu hình và khởi động
  const context = await browser
    .useFingerprint(fingerprint, {
      usePerfectCanvas: true,
      safeWebGL: true,
      safeCanvas: true,
    })
    .useProxy('http://user:pass@proxy.example.com:8080', {
      changeTimezone: true,
      changeGeolocation: true,
      changeWebRTC: 'replace',
    })
    .useProfile('./profiles/user_01', {
      loadProxy: true,
      loadFingerprint: true,
    })
    .launch({ headless: false })
    .newContext();

  const page = await context.newPage();
  await page.goto('https://example.com');

  // Đóng và lưu profile
  await browser.quit();
}
```

## API

### `new BrowserEngine(launcher?)`

Tạo instance mới. `launcher` là tùy chọn — mặc định dùng launcher đã được patch sẵn.

### `BrowserEngine.useFingerprint(data, options?)`

Gắn fingerprint cho browser.

- `data` — Chuỗi JSON fingerprint từ `newFingerprint()` hoặc từ service.
- `options.usePerfectCanvas` — Render canvas chính xác theo fingerprint (mặc định `true`).
- `options.safeWebGL` — Làm nhiễu WebGL (mặc định `true`).
- `options.safeCanvas` — Làm nhiễu Canvas 2D (mặc định `true`).
- `options.safeAudio` — Làm nhiễu Web Audio API (mặc định `true`).
- `options.safeBattery` — Giả lập Battery API (mặc định `true`).
- `options.safeElementSize` — Che giấu tọa độ DOM element (mặc định `false`).
- `options.useFontPack` — Đồng bộ font với fingerprint (mặc định `true`).
- `options.emulateDeviceScaleFactor` — Giả lập màn hình Retina (mặc định `true`).
- `options.emulateSensorAPI` — Giả lập Sensor API (mặc định `true`).

### `BrowserEngine.useProxy(data, options?)`

Định tuyến traffic qua proxy.

- `data` — Proxy URL định dạng `protocol://user:pass@host:port`.
- `options.changeTimezone` — Đổi múi giờ theo proxy (mặc định `true`).
- `options.changeGeolocation` — Đổi vị trí địa lý (mặc định `false`).
- `options.changeBrowserLanguage` — Đổi ngôn ngữ trình duyệt (mặc định `true`).
- `options.changeWebRTC` — `'enable' | 'disable' | 'replace'` (mặc định `'replace'`).
- `options.enableTunneling` — Bật/tắt tunneling tích hợp (mặc định `true`).
- `options.dnsMode` — `'system-proxy' | 'custom-proxy' | 'custom-direct'` (mặc định `'system-proxy'`).
- `options.enableQUIC` — Bật QUIC nếu proxy hỗ trợ UDP (mặc định `false`).

### `BrowserEngine.useProfile(dirPath, options?)`

Liên kết thư mục profile.

- `dirPath` — Đường dẫn thư mục lưu cookie, localStorage.
- `options.loadProxy` — Tự động load proxy từ profile cũ (mặc định `true`).
- `options.loadFingerprint` — Tự động load fingerprint từ profile cũ (mặc định `true`).

### `BrowserEngine.launch(options?)`

Khởi động engine. Chỉ được gọi một lần.

- `options` — Override context options (viewport, locale...).

### `BrowserEngine.newContext(options?)`

Tạo Playwright BrowserContext. Phải gọi `launch()` trước.

Trả về `Promise<BrowserContext>`.

### `BrowserEngine.newFingerprint(options?)`

Lấy fingerprint mới từ service.

- `options.tags` — Lọc theo thiết bị, OS, trình duyệt: `['Chrome', 'Desktop', 'Windows 10']`.
- `options.timeLimit` — `'*' | '15 days' | '30 days' | '60 days'`.
- `options.minWidth / maxWidth` — Lọc theo độ phân giải màn hình.
- `options.minHeight / maxHeight` — Lọc theo độ phân giải màn hình.
- `options.minBrowserVersion / maxBrowserVersion` — Lọc theo phiên bản trình duyệt.
- `options.perfectCanvasRequest` — PerfectCanvas request từ CanvasInspector.
- `options.dynamicPerfectCanvas` — Cho phép render động (mặc định `true`).

### `BrowserEngine.quit(saveDataPath?)`

Đóng trình duyệt, giải phóng tài nguyên, lưu profile.

- `saveDataPath` — Ghi đè đường dẫn lưu profile (nếu muốn).

## API nâng cao

### `BrowserEngine.repackChromium(launcher)`

Thay thế launcher mặc định bằng bản tùy chỉnh.

```ts
browser.repackChromium(myCustomLauncher);
```

### `BrowserEngine.engine`

Truy cập instance engine gốc cho các tác vụ nâng cao.


## Tài liệu

Xem thêm trong thư mục `docs/`:

- [Welcome.md](docs/Welcome.md) — Giới thiệu dự án và lời khuyên đọc.
- [CONVENTIONS.md](docs/CONVENTIONS.md) — Quy ước code.
- [STACK.md](docs/STACK.md) — Công nghệ sử dụng và lý do chọn.
- [WORKFLOW.md](docs/WORKFLOW.md) — Quy trình phát triển tính năng.
- [TRACKING.md](docs/TRACKING.md) — Theo dõi feature và issue.
- [NOTES.md](docs/NOTES.md) — Ghi chú kiến trúc và lưu ý phát triển.

## Phát triển

```bash
npm run lint       # Kiểm tra code style
npm run typecheck  # Kiểm tra TypeScript
npm run build      # Bundle ESM + CJS
npm test           # Chạy test với browser thật
```

## License

MIT
