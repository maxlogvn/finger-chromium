# Tham khảo API

Tài liệu này mô tả toàn bộ API public của `fingerprint-chromium-engine`, bao gồm tất cả type, method, và tùy chọn cấu hình.

## BrowserEngine

Class chính để điều khiển trình duyệt Chromium với hỗ trợ fingerprint, proxy và profile.

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';
```

### Static Methods

#### `BrowserEngine.newFingerprint(options?)`

Lấy fingerprint mới từ service mà không cần tạo instance `BrowserEngine` đầy đủ. Engine tạm được tự động cleanup sau khi fetch xong.

```ts
const fingerprint: string = await BrowserEngine.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
  timeLimit: '30 days',
});
```

| Tham số   | Kiểu                          | Mặc định                                   | Mô tả                               |
| --------- | ----------------------------- | ------------------------------------------ | ----------------------------------- |
| `options` | [`FetchOptions`](#fetchoptions) | `{ tags: ['Microsoft Windows', 'Chrome'] }` | Tùy chọn lọc fingerprint từ service |

### Instance Methods

#### `engine.useFingerprint(data, options?)`

Gắn fingerprint cho trình duyệt. Phải gọi trước `launch()`.

```ts
engine.useFingerprint(fingerprintData, {
  usePerfectCanvas: true,
  safeWebGL: true,
});
```

| Tham số    | Kiểu                                      | Mặc định | Mô tả                                           |
| ---------- | ----------------------------------------- | -------- | ----------------------------------------------- |
| `data`     | `string`                                  | (bắt buộc)| Chuỗi JSON fingerprint từ `newFingerprint()`    |
| `options`  | [`FingerprintOptions`](#fingerprintoptions) | `{}`     | Tùy chọn kiểm soát kỹ thuật giả lập fingerprint  |

#### `engine.useProxy(data, options?)`

Định tuyến traffic qua proxy. Phải gọi trước `launch()`.

```ts
engine.useProxy('http://user:pass@host:port', {
  changeTimezone: true,
  changeWebRTC: 'replace',
});
```

| Tham số    | Kiểu                                | Mặc định  | Mô tả                                              |
| ---------- | ----------------------------------- | --------- | -------------------------------------------------- |
| `data`     | `string`                            | (bắt buộc) | Proxy URL: `protocol://user:pass@host:port`        |
| `options`  | [`ProxyOptions`](#proxyoptions)     | `{}`      | Tùy chọn cấu hình proxy                            |

#### `engine.useProfile(dirPath, options?)`

Liên kết thư mục profile để đọc/ghi cookie, localStorage, session. Phải gọi trước `launch()`.

```ts
engine.useProfile('./profiles/user_01', {
  loadFingerprint: true,
  loadProxy: true,
});
```

| Tham số    | Kiểu                                  | Mặc định  | Mô tả                                  |
| ---------- | ------------------------------------- | --------- | -------------------------------------- |
| `dirPath`  | `string`                              | (bắt buộc) | Đường dẫn thư mục profile               |
| `options`  | [`ProfileOptions`](#profileoptions)   | `{}`      | Tùy chọn cấu hình profile               |

#### `engine.useLauncher(launcher, connector?)`

Thay thế launcher mặc định bằng bản Playwright tùy chỉnh.

```ts
import { chromium as playwrightChromium } from 'playwright-core';
engine.useLauncher(playwrightChromium);
```

| Tham số      | Kiểu                                                                | Mặc định | Mô tả                                     |
| ------------ | ------------------------------------------------------------------- | -------- | ----------------------------------------- |
| `launcher`   | `Pick<BrowserType, 'launch' \| 'launchPersistentContext'>`         | (bắt buộc)| Đối tượng launcher của Playwright         |
| `connector`  | `Connector`                                                         | (tuỳ chọn)| Connector tuỳ chỉnh cho engine            |

#### `engine.launch(options?)`

Khởi tạo engine với toàn bộ cấu hình đã thiết lập. **Chỉ được gọi một lần** cho mỗi instance.

```ts
engine.launch({ headless: false });
```

| Tham số   | Kiểu                   | Mặc định                       | Mô tả                              |
| --------- | ---------------------- | ------------------------------ | ---------------------------------- |
| `options` | `Partial<PluginLaunchOptions>` | `{ headless: false, hasTouch: true }` | Override tuỳ chọn launch |

Trả về `this` để tiếp tục chain.

#### `engine.newContext(options?)`

Tạo `BrowserContext` của Playwright để bắt đầu phiên duyệt web. **Phải gọi `launch()` trước.**

```ts
const context: BrowserContext = await engine.newContext();
const page = await context.newPage();
```

| Tham số   | Kiểu                    | Mặc định | Mô tả                                   |
| --------- | ----------------------- | -------- | --------------------------------------- |
| `options` | `Partial<PluginLaunchOptions>` | `{}`     | Override tuỳ chọn context (viewport...) |

#### `engine.close(saveDataPath?)`

Đóng trình duyệt, giải phóng tài nguyên và lưu profile. Gọi khi chưa `launch()` sẽ không làm gì (no-op).

```ts
await engine.close();                           // Lưu về path trong useProfile()
await engine.close('./profiles/user_backup');   // Lưu về path khác
```

| Tham số        | Kiểu      | Mặc định                     | Mô tả                                               |
| -------------- | --------- | ---------------------------- | --------------------------------------------------- |
| `saveDataPath` | `string`  | Path từ `useProfile()`       | Ghi đè đường dẫn lưu profile cho lần close này       |

---

## FetchOptions

Tùy chọn lọc fingerprint khi gọi `newFingerprint()`.

Xem chi tiết tại [fingerprint.md](fingerprint.md#fetchoptions).

### Thuộc tính

| Thuộc tính                    | Kiểu                              | Mặc định | Mô tả                                                              |
| ----------------------------- | --------------------------------- | -------- | ------------------------------------------------------------------ |
| `tags`                        | `Tag[]`                           | (tuỳ chọn)| Lọc fingerprint theo tag thiết bị, OS hoặc trình duyệt             |
| `timeLimit`                   | [`Time`](#type-time)              | (tuỳ chọn)| Lọc fingerprint theo ngày thu thập                                 |
| `minWidth`                    | `number`                          | (tuỳ chọn)| Chiều rộng màn hình tối thiểu (px)                                 |
| `maxWidth`                    | `number`                          | (tuỳ chọn)| Chiều rộng màn hình tối đa (px)                                    |
| `minHeight`                   | `number`                          | (tuỳ chọn)| Chiều cao màn hình tối thiểu (px)                                  |
| `maxHeight`                   | `number`                          | (tuỳ chọn)| Chiều cao màn hình tối đa (px)                                     |
| `minBrowserVersion`           | `number \| 'current'`             | (tuỳ chọn)| Phiên bản trình duyệt tối thiểu. `'current'` = phiên bản hiện tại  |
| `maxBrowserVersion`           | `number \| 'current'`             | (tuỳ chọn)| Phiên bản trình duyệt tối đa. Đặt bằng `minBrowserVersion` để lọc đúng một phiên bản |
| `perfectCanvasLogs`           | `boolean`                         | `false`   | Bật logging fingerprint có dữ liệu PerfectCanvas                    |
| `perfectCanvasRequest`        | `string`                          | (tuỳ chọn)| PerfectCanvas request từ ứng dụng CanvasInspector                   |
| `dynamicPerfectCanvas`        | `boolean`                         | `true`    | Cho phép render PerfectCanvas động từ các máy đang kết nối           |
| `enablePrecomputedFingerprints`| `boolean`                         | `true`    | Cho phép truy vấn database tĩnh trước khi dùng dynamic rendering     |
| `enableCustomServer`          | `boolean`                         | `false`   | Chỉ lấy fingerprint từ custom server (yêu cầu tài khoản hỗ trợ)      |

### Type: Tag

```ts
type Tag =
  | '*'
  | 'Desktop' | 'Mobile'
  | 'Microsoft Windows' | 'Apple Mac' | 'Android' | 'Linux'
  | 'iPad' | 'iPhone'
  | 'Edge' | 'Chrome' | 'Safari' | 'Firefox' | 'YaBrowser'
  | 'Windows 7' | 'Windows 8' | 'Windows 10';
```

### Type: Time

```ts
type Time = '*' | '15 days' | '30 days' | '60 days';
```

---

## FingerprintOptions

Tùy chọn kiểm soát kỹ thuật giả lập fingerprint trên trình duyệt.

Xem chi tiết tại [fingerprint.md](fingerprint.md#fingerprintoptions).

| Thuộc tính                     | Kiểu      | Mặc định | Mô tả                                                                  |
| ------------------------------ | --------- | -------- | ---------------------------------------------------------------------- |
| `emulateDeviceScaleFactor`     | `boolean` | `true`   | Giả lập màn hình HiDPI/Retina theo fingerprint                          |
| `emulateSensorAPI`             | `boolean` | `true`   | Giả lập Sensor API (gia tốc kế, con quay hồi chuyển)                    |
| `usePerfectCanvas`             | `boolean` | `true`   | Thay thế dữ liệu Canvas chính xác theo fingerprint (yêu cầu PerfectCanvas) |
| `useFontPack`                  | `boolean` | `true`   | Dùng FontPack để đồng bộ font với fingerprint                            |
| `safeElementSize`              | `boolean` | `false`  | Che giấu tọa độ DOM, chống ClientRects fingerprinting                   |
| `safeBattery`                  | `boolean` | `true`   | Giả lập Battery API với giá trị khác nhau mỗi phiên                      |
| `safeCanvas`                   | `boolean` | `true`   | Thêm nhiễu vào Canvas 2D để chống canvas fingerprinting                  |
| `safeAudio`                    | `boolean` | `true`   | Thêm nhiễu vào Web Audio API, che giấu thông tin phần cứng âm thanh       |
| `safeWebGL`                    | `boolean` | `true`   | Thêm nhiễu vào WebGL, che giấu thông tin GPU                             |

---

## ProxyOptions

Tùy chọn cấu hình proxy cho trình duyệt.

Xem chi tiết tại [proxy.md](proxy.md).

| Thuộc tính               | Kiểu                                                                        | Mặc định         | Mô tả                                                                  |
| ------------------------ | --------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `changeBrowserLanguage`  | `boolean`                                                                   | `true`           | Đổi ngôn ngữ trình duyệt theo quốc gia của proxy                         |
| `changeGeolocation`      | `boolean`                                                                   | `false`          | Đổi vị trí địa lý theo IP của proxy                                     |
| `changeTimezone`         | `boolean`                                                                   | `true`           | Đổi múi giờ trình duyệt theo IP của proxy                               |
| `changeWebRTC`           | `'enable' \| 'disable' \| 'replace'`                                        | `'replace'`      | Cấu hình hành vi WebRTC                                                 |
| `publicIPv4`             | `PublicIPReplacement`                                                       | `'auto'`         | Địa chỉ IPv4 công khai qua WebRTC                                       |
| `publicIPv6`             | `PublicIPReplacement`                                                       | `'auto'`         | Địa chỉ IPv6 công khai qua WebRTC                                       |
| `privateIPv4`            | `PrivateIPReplacement \| 'private class a' \| 'private class b' \| 'private class c'` | `'local'`        | Địa chỉ IPv4 nội bộ qua WebRTC                                          |
| `privateIPv6`            | `PrivateIPReplacement \| 'unique local address'`                            | `'local'`        | Địa chỉ IPv6 nội bộ qua WebRTC                                          |
| `ipExtractionMethod`     | `IPExtractionMethod \| { v4: IPExtractionMethod; v6: IPExtractionMethod }`   | `'raw'`          | Phương thức trích xuất IP từ response của `ipExtractionURL`              |
| `ipExtractionParam`      | `string \| { v4: string; v6: string }`                                      | `''`             | Tham số trích xuất IP dùng với `ipExtractionMethod`                      |
| `ipExtractionURL`        | `string \| { v4: string; v6: string }`                                      | `''`             | URL xác định IP công khai qua proxy                                     |
| `detectExternalIP`       | `boolean \| { v4: boolean; v6: boolean }`                                   | `true`           | Tự động phát hiện IP công khai bằng service bên ngoài                     |
| `ipInfoMethod`           | `'database' \| 'ip-api.com'`                                                | `'database'`     | Phương thức tra cứu thông tin địa lý từ IP                               |
| `ipInfoKey`              | `string`                                                                    | `''`             | API key của ip-api.com (bản trả phí)                                    |
| `enableTunneling`        | `boolean`                                                                   | `true`           | Bật/tắt hệ thống tunneling. Tắt nếu dùng VPN                             |
| `enableQUIC`             | `boolean`                                                                   | `false`          | Bật giao thức QUIC (UDP). Proxy phải hỗ trợ UDP                         |
| `dnsMode`                | `'system-proxy' \| 'custom-proxy' \| 'custom-direct'`                       | `'system-proxy'` | Chế độ phân giải DNS                                                    |
| `dnsIP`                  | `string`                                                                    | `'1.1.1.1'`     | Địa chỉ IP DNS server cho `custom-proxy` hoặc `custom-direct`           |

### Type: PublicIPReplacement

```ts
type PublicIPReplacement = string | 'disable' | 'auto';
```

### Type: PrivateIPReplacement

```ts
type PrivateIPReplacement = string | 'disable' | 'local';
```

### Type: IPExtractionMethod

```ts
type IPExtractionMethod = 'raw' | 'xpath' | 'regexp' | 'jsonpath';
```

---

## ProfileOptions

Tùy chọn cấu hình profile cho trình duyệt.

Xem chi tiết tại [profile.md](profile.md).

| Thuộc tính         | Kiểu      | Mặc định | Mô tả                                                |
| ------------------ | --------- | -------- | ---------------------------------------------------- |
| `loadProxy`        | `boolean` | `true`   | Tự động load proxy đã dùng từ thư mục profile         |
| `loadFingerprint`  | `boolean` | `true`   | Tự động load fingerprint đã dùng từ thư mục profile   |

---

## PWChromium (Interface)

Interface mô tả toàn bộ API của `BrowserEngine`. Dùng để tham khảo hoặc khi type `BrowserEngine` instance.

```ts
import type { PWChromium } from 'fingerprint-chromium-engine';

const engine: PWChromium = new BrowserEngine();
```

### Method Signature

```ts
interface PWChromium {
  launch(options?: Partial<PluginLaunchOptions>): this;
  newContext(options?: Partial<PluginLaunchOptions>): Promise<BrowserContext>;
  close(saveDataPath?: string): Promise<void>;
}
```

---

## PluginLaunchOptions

Type mở rộng từ `launchPersistentContext` của Playwright. Dùng để override tuỳ chọn launch/context mặc định.

```ts
type PluginLaunchOptions = Parameters<BrowserType['launchPersistentContext']>[1];
```

Các tuỳ chọn phổ biến:

| Tuỳ chọn      | Kiểu       | Mặc định  | Mô tả                        |
| ------------- | ---------- | --------- | ---------------------------- |
| `headless`    | `boolean`  | `false`   | Chạy ở chế độ headless       |
| `hasTouch`    | `boolean`  | `true`    | Bật hỗ trợ touch             |
| `viewport`    | `object`   | (tuỳ chọn)| Viewport { width, height }   |
| `locale`      | `string`   | (tuỳ chọn)| Locale trình duyệt           |
| `timezoneId`  | `string`   | (tuỳ chọn)| Múi giờ                      |

---

## Lớp lỗi (Error Classes)

Thư viện export các lớp lỗi chuyên biệt để dễ dàng xử lý từng loại lỗi.

```ts
import {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from 'fingerprint-chromium-engine';
```

| Lớp lỗi               | Mô tả                                                      |
| --------------------- | ---------------------------------------------------------- |
| `PluginError`         | Lỗi cơ bản, dùng cho hầu hết các tình huống               |
| `MissingKeyError`     | Thiếu private key (`BABLOSOFT_KEY`)                        |
| `InvalidEngineError`  | Engine chưa được tải hoặc giải nén                         |
| `EngineTimeoutError`  | Timeout khi tải engine                                     |
| `RequestTimeoutError` | Timeout khi gửi request đến service                        |

Xem chi tiết tại [error-handling.md](error-handling.md).

---

## Import tổng hợp

```ts
// Named export - class chính
import { BrowserEngine } from 'fingerprint-chromium-engine';

// Type exports
import type {
  PWChromium,
  FetchOptions,
  FingerprintOptions,
  ProfileOptions,
  ProxyOptions,
  PluginLaunchOptions,
  Launcher,
} from 'fingerprint-chromium-engine';

// Error exports
import {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from 'fingerprint-chromium-engine';
```
