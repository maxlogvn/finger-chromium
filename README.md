<p align="center">
  <h1 align="center">FINGERPRINT-CHROMIUM</h1>
</p>

<p align="center">
  Native Chromium anti-detect engine cho Playwright — inject fingerprint thiết bị thật, đồng bộ proxy, và quản lý profile bền vững.
</p>

<p align="center">
  <a href="#tính-năng">Tính năng</a>
  &nbsp;|&nbsp;
  <a href="#cài-đặt">Cài đặt</a>
  &nbsp;|&nbsp;
  <a href="#sử-dụng-nhanh">Sử dụng nhanh</a>
  &nbsp;|&nbsp;
  <a href="#api">API</a>
  &nbsp;|&nbsp;
  <a href="#biến-môi-trường">Biến môi trường</a>
  &nbsp;|&nbsp;
  <a href="#tài-liệu">Tài liệu</a>
  &nbsp;|&nbsp;
  <a href="#phát-triển">Phát triển</a>
</p>

---

## Tính năng

- **Fingerprint thật** — Inject fingerprint thu thập từ thiết bị thực tế ở cấp độ C/C++ thông qua CDP, không để lại vết override trong JavaScript context. [Chi tiết](docs/products/fingerprint-config.product.md)
- **PerfectCanvas** — Render canvas chính xác theo fingerprint đích (cần request từ CanvasInspector).
- **Proxy đồng bộ** — Tương thích HTTP/HTTPS/SOCKS4/SOCKS5, tự động đồng bộ timezone, geolocation, ngôn ngữ và WebRTC theo IP proxy. [Chi tiết](docs/products/proxy-config.product.md)
- **Hỗ trợ WebRTC** — Thay thế IP thật bằng IP proxy trong WebRTC, hoặc tắt hoàn toàn.
- **Profile bền vững** — Lưu và tải cookies, localStorage, session, lịch sử đăng nhập giữa các phiên. [Chi tiết](docs/products/profile-management.product.md)
- **Nhiều kỹ thuật chống detect** — Nhiễu WebGL, nhiễu Canvas/Web Audio, che giấu DOM element, giả lập Sensor API, Battery API, và màn hình HiDPI.
- **Quản lý viewport tự động** — Resize viewport qua CDP, đồng bộ kích thước fingerprint. [Chi tiết](docs/products/viewport-management.product.md)
- **Chỉ Windows** — Được xây dựng dành riêng cho Windows (win32, cả 32-bit và 64-bit).

## Yêu cầu

| Điều kiện | Giá trị |
|---|---|
| Node.js | >= 18 |
| Hệ điều hành | Windows (win32) |
| Peer dependency | `playwright-core` >= 1.60 |

## Cài đặt

```bash
npm install github:maxlogvn/finger-chromium
```

Sau khi cài, npm tự động chạy `prepare` script để build thư viện. Nếu build không tự động chạy (do `--ignore-scripts`), hãy chạy thủ công:

```bash
npm run build
```

Đảm bảo bạn đã cài `playwright-core` và tải Chromium:

```bash
npm install playwright-core
npx playwright install chromium
```

## Sử dụng nhanh

> **Ghi chú:** Key bảo mật được set qua biến môi trường `BABLOSOFT_KEY`, không phải qua method riêng.

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const context = await Chromium
  .useFingerprint(fingerprintData, {
    usePerfectCanvas: true,
    safeWebGL: true,
    safeAudio: true,
  })
  .useProxy('http://user:pass@host:port', {
    changeTimezone: true,
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

await Chromium.quit(); // đóng và lưu profile
```

## API

Chi tiết đầy đủ tại [BrowserEngine product doc](docs/products/browser-engine.product.md).

### `Chromium`

Instance singleton của `BrowserEngine`. Các method gọi chain được, **phải gọi trước `launch()`**.

#### `useFingerprint(data: string, options?: FingerprintOptions): this`

Gắn fingerprint vào trình duyệt. `data` là chuỗi fingerprint từ service bablosoft.

| Option | Mặc định | Mô tả |
|---|---|---|
| `usePerfectCanvas` | `true` | Render canvas chính xác theo fingerprint |
| `useFontPack` | `true` | Đồng bộ font với fingerprint (cần FontPack) |
| `emulateDeviceScaleFactor` | `true` | Giả lập màn hình Retina/HiDPI |
| `emulateSensorAPI` | `true` | Giả lập Sensor API (gia tốc kế, con quay hồi chuyển...) |
| `safeCanvas` | `true` | Nhiễu Canvas 2D chống canvas fingerprinting |
| `safeWebGL` | `true` | Nhiễu WebGL che giấu thông tin GPU |
| `safeAudio` | `true` | Nhiễu Web Audio API |
| `safeBattery` | `true` | Giả lập Battery API |
| `safeElementSize` | `false` | Che giấu tọa độ DOM element thật |

Xem thêm: [Fingerprint Config product doc](docs/products/fingerprint-config.product.md)

#### `useProxy(data: string, options?: ProxyOptions): this`

Định tuyến toàn bộ traffic qua proxy. Định dạng: `protocol://user:pass@host:port`.

| Option | Mặc định | Mô tả |
|---|---|---|
| `changeBrowserLanguage` | `true` | Đổi ngôn ngữ trình duyệt theo proxy |
| `changeTimezone` | `true` | Đổi múi giờ theo proxy |
| `changeGeolocation` | `false` | Đổi vị trí địa lý theo proxy |
| `changeWebRTC` | `'replace'` | `'enable'` / `'disable'` / `'replace'` |
| `enableTunneling` | `true` | Bật/tắt hệ thống tunneling tích hợp |
| `enableQUIC` | `false` | Bật QUIC (cần proxy hỗ trợ UDP) |
| `dnsMode` | `'system-proxy'` | `'system-proxy'` / `'custom-proxy'` / `'custom-direct'` |
| `ipInfoMethod` | `'database'` | `'database'` / `'ip-api.com'` |
| `detectExternalIP` | `true` | Tự động phát hiện IP công khai |

Xem thêm: [Proxy Config product doc](docs/products/proxy-config.product.md)

#### `useProfile(dirPath: string, options?: ProfileOptions): this`

Liên kết thư mục profile để duy trì trạng thái giữa các phiên.

| Option | Mặc định | Mô tả |
|---|---|---|
| `loadProxy` | `true` | Tải proxy đã dùng lần trước từ profile |
| `loadFingerprint` | `true` | Tải fingerprint đã dùng lần trước từ profile |

Xem thêm: [Profile Management product doc](docs/products/profile-management.product.md)

#### `launch(options?: PluginLaunchOptions): this`

Khởi tạo engine. Chỉ được gọi **một lần**. Ném lỗi nếu gọi lại.

```ts
Chromium.launch({ headless: false, hasTouch: true })
```

#### `newContext(options?: PluginLaunchOptions): Promise<BrowserContext>`

Tạo `BrowserContext` Playwright. Phải gọi `launch()` trước. Chỉ cho phép một context tại một thời điểm.

```ts
const context = await Chromium.newContext()
```

#### `newFingerprint(options?: FetchOptions): Promise<string | undefined>`

Lấy fingerprint mới từ service, có thể lọc theo tag, thời gian, kích thước màn hình, phiên bản trình duyệt.

```ts
const fp = await Chromium.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
  timeLimit: '30 days',
  minWidth: 1280,
  minHeight: 720,
})
```

Xem thêm: [Type System product doc](docs/products/type-system.product.md) (FetchOptions)

#### `quit(saveDataPath?: string): Promise<void>`

Đóng trình duyệt, giải phóng tài nguyên và lưu profile. Có thể ghi đè đường dẫn lưu profile.

```ts
await Chromium.quit()
await Chromium.quit('./profiles/user_backup')
```

## Biến môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `BABLOSOFT_KEY` | `''` | Key bảo mật cho engine (bắt buộc để dùng fingerprint) |
| `BROWSER_RUNNING_DIR` | `.tmp/browser/running` | Thư mục tạm cho trình duyệt đang chạy |
| `ENGINE_WORKING_DIR` | `.tmp/browser/engine` | Thư mục làm việc của engine |
| `DEBUG` | — | Bật debug log: `browser-with-fingerprints:*` |

## Kiến trúc

```
src/
├── adapter/playwright/   # Playwright adapter (chromium.ts, engine.ts, loader.ts, data.ts)
├── plugin/               # Plugin hệ thống (launcher, connector, mutex, browser, config)
├── loader/               # Tải engine, quản lý file nhị phân
├── common/               # Tiện ích dùng chung
├── types/                # TypeScript type definitions
└── index.ts              # Export công khai
```

Fingerprint được inject ở cấp độ **C/C++** thông qua CDP message trước khi trình duyệt chạy, không để lại vết override trong JavaScript context.

## Tài liệu

| Tài liệu | Mô tả |
|---|---|
| [Tổng quan dự án](docs/Welcome.md) | Giới thiệu, cấu trúc docs, ghi chú code issues |
| [Hướng dẫn phát triển](docs/WORKFLOW.md) | Quy trình phát triển tính năng từ đầu đến cuối |
| [Quy ước code](docs/CONVENTIONS.md) | Đặt tên, comment, error handling, CDP, testing |
| [Công nghệ sử dụng](docs/STACK.md) | TypeScript, Playwright, dependencies |
| [Roadmap](docs/ROADMAP.md) | Trạng thái tất cả tính năng |

### Product docs

| Tính năng | Mô tả |
|---|---|
| [BrowserEngine](docs/products/browser-engine.product.md) | Fluent API tổng quan: launch, newContext, quit |
| [Fingerprint Config](docs/products/fingerprint-config.product.md) | Tùy chọn fingerprint: PerfectCanvas, WebGL, Audio... |
| [Proxy Config](docs/products/proxy-config.product.md) | Proxy: HTTP/SOCKS, DNS, WebRTC, timezone sync |
| [Profile Management](docs/products/profile-management.product.md) | Profile: lưu/tải cookies, proxy, fingerprint |
| [Viewport Management](docs/products/viewport-management.product.md) | Resize viewport tự động qua CDP |
| [Hook Binding](docs/products/hook-binding.product.md) | Tự động resize, chặn thay đổi viewport |
| [Type System](docs/products/type-system.product.md) | TypeScript types: FingerprintOptions, ProxyOptions... |
| [Error Hierarchy](docs/products/error-hierarchy.product.md) | Xử lý lỗi: PluginError, MissingKeyError... |

## Phát triển

```bash
npm run lint        # ESLint
npm run lint:fix    # ESLint + tự động sửa
npm run format      # Prettier
npm test            # Mocha tests (trình duyệt thật)
npm run build       # Build bundle (tsup)
npm run dev         # Watch mode
```

- Tất cả test chạy với **trình duyệt thật** — không mock Playwright.
- File test đặt trong `tests/`.

## Ghi chú quan trọng

- **Chỉ hỗ trợ Windows.** Đảm bảo hệ thống của bạn là Windows trước khi sử dụng.
- **Key bablosoft** — set qua biến môi trường `BABLOSOFT_KEY`.
- **PerfectCanvas** yêu cầu lấy request từ ứng dụng CanvasInspector (xem wiki bablosoft).
- **FontPack** có thể tải tại [bablosoft wiki](https://wiki.bablosoft.com/doku.php?id=fontpack).

## Góp ý và báo lỗi

Báo lỗi tại [GitHub Issues](https://github.com/maxlogvn/PrivateChromiumEngine/issues).

## Giấy phép

MIT
