# Product: Hệ thống kiểu (Type System)

## Tổng quan

Hệ thống kiểu (types) là tập hợp các interface và type định nghĩa cấu trúc dữ liệu mà thư viện sử dụng. Chúng nằm trong thư mục `src/types/`, gồm 5 file, mỗi file phụ trách một nhóm riêng biệt.

Khi bạn code với TypeScript, IDE sẽ tự động gợi ý property names, kiểu dữ liệu, và báo lỗi nếu bạn truyền sai kiểu. Đây chính là giá trị lớn nhất của hệ thống này.

## Cách dùng

### Import type

Các type được export sẵn từ package, bạn có thể import trực tiếp:

```ts
import {
  Chromium,
  type FingerprintOptions,
  type ProxyOptions,
  type ProfileOptions,
  type FetchOptions,
} from 'fingerprint-chromium-engine';
```

Hoặc dùng interface chính:

```ts
import { type PWChromium } from 'fingerprint-chromium-engine';
```

### Ví dụ: Cấu hình fingerprint

```ts
Chromium.useFingerprint(fingerprintData, {
  usePerfectCanvas: true,   // Giả lập Canvas chính xác
  safeWebGL: true,           // Che giấu thông tin GPU
  safeAudio: true,           // Che giấu thông tin âm thanh
  safeCanvas: true,          // Thêm nhiễu vào Canvas
  safeBattery: true,         // Giả lập Battery API khác mỗi phiên
  safeElementSize: false,    // Không can thiệp ClientRects
  useFontPack: true,         // Đồng bộ font
  emulateSensorAPI: true,    // Giả lập cảm biến
  emulateDeviceScaleFactor: true, // Giả lập màn hình HiDPI
});
```

### Ví dụ: Cấu hình proxy với đầy đủ options

```ts
Chromium.useProxy('socks5://user:pass@127.0.0.1:1080', {
  changeWebRTC: 'replace',      // Thay IP WebRTC bằng IP proxy
  changeTimezone: true,          // Đồng bộ múi giờ với proxy
  changeGeolocation: true,       // Đồng bộ vị trí địa lý
  changeBrowserLanguage: true,   // Đồng bộ ngôn ngữ trình duyệt
  dnsMode: 'custom-direct',      // DNS tùy chỉnh, phân giải cục bộ
  dnsIP: '1.1.1.1',              // Dùng Cloudflare DNS
  enableTunneling: true,         // Bật tunneling
  enableQUIC: false,             // Tắt QUIC (UDP)
  ipInfoMethod: 'database',      // Tra cứu IP bằng database nội bộ
});
```

### Ví dụ: Lọc fingerprint

```ts
const fp = await Chromium.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
  timeLimit: '30 days',          // Fingerprint thu thập trong 30 ngày gần nhất
  minWidth: 1920,
  minHeight: 1080,
  minBrowserVersion: 'current',  // Khớp với phiên bản Chrome hiện tại
});
```

## Tổng quan các type

### `PWChromium` -- Interface chính

Đây là "bản hợp đồng" của singleton `Chromium`. Nếu bạn implement interface này, bạn có thể thay thế `Chromium` bằng implementation khác.

```ts
interface PWChromium {
  useFingerprint(data: string, options?: FingerprintOptions): this;
  useProxy(data: string, options?: ProxyOptions): this;
  useProfile(dirPath: string, options?: ProfileOptions): this;
  launch(options?: Partial<PluginLaunchOptions>): this;
  newContext(options?: Partial<PluginLaunchOptions>): Promise<BrowserContext>;
  quit(saveDataPath?: string): Promise<void>;
  newFingerprint(options: FetchOptions): Promise<string | undefined>;
  repackChromium(launcher: object): this;
  readonly engine: object;
}
```

### `FingerprintOptions` -- Tùy chọn fingerprint

Tất cả đều là boolean, mặc định `true` ngoại trừ `safeElementSize` (mặc định `false`).

| Field | Mặc định | Tác dụng |
|---|---|---|
| `usePerfectCanvas` | `true` | Giả lập Canvas chính xác nhất (cần fingerprint có dữ liệu PerfectCanvas) |
| `safeCanvas` | `true` | Thêm nhiễu Canvas 2D |
| `safeWebGL` | `true` | Che giấu thông tin GPU |
| `safeAudio` | `true` | Che giấu thông tin âm thanh |
| `safeBattery` | `true` | Giả lập Battery API |
| `safeElementSize` | `false` | Che giấu tọa độ DOM element |
| `useFontPack` | `true` | Đồng bộ font |
| `emulateSensorAPI` | `true` | Giả lập cảm biến (cho mobile) |
| `emulateDeviceScaleFactor` | `true` | Giả lập màn hình HiDPI |

### `ProxyOptions` -- Tùy chọn proxy

Type phức tạp nhất với 17 fields. Dưới đây là các nhóm chính:

| Field | Mặc định | Tác dụng |
|---|---|---|
| `changeWebRTC` | `'replace'` | `'enable'`: bật WebRTC, lộ IP thật; `'disable'`: tắt; `'replace'`: thay IP bằng IP proxy |
| `changeTimezone` | `true` | Đồng bộ múi giờ với proxy |
| `changeGeolocation` | `false` | Đồng bộ vị trí địa lý |
| `changeBrowserLanguage` | `true` | Đồng bộ ngôn ngữ |
| `dnsMode` | `'system-proxy'` | `'system-proxy'`: DNS qua proxy; `'custom-proxy'`: DNS tùy chỉnh qua proxy; `'custom-direct'`: DNS tùy chỉnh cục bộ |
| `enableTunneling` | `true` | Bắt buộc bật để proxy hoạt động |
| `enableQUIC` | `false` | Chỉ bật nếu proxy hỗ trợ UDP |

### `ProfileOptions` -- Tùy chọn profile

```ts
interface ProfileOptions {
  loadProxy?: boolean;        // @default true
  loadFingerprint?: boolean;  // @default true
}
```

### `FetchOptions` -- Bộ lọc fingerprint

Dùng để tìm fingerprint phù hợp từ service.

```ts
interface FetchOptions {
  tags?: Tag[];                             // Lọc theo tag (Desktop, Chrome...)
  timeLimit?: Time;                         // Lọc theo ngày thu thập
  minWidth?: number;                        // Độ phân giải tối thiểu
  maxWidth?: number;                        // Độ phân giải tối đa
  minHeight?: number;
  maxHeight?: number;
  minBrowserVersion?: number | 'current';  // 'current' = Chrome hiện tại
  maxBrowserVersion?: number | 'current';
  perfectCanvasLogs?: boolean;             // @default false
  perfectCanvasRequest?: string;            // URL để request PerfectCanvas
  enableCustomServer?: boolean;             // @default false
  dynamicPerfectCanvas?: boolean;           // @default true
  enablePrecomputedFingerprints?: boolean;  // @default true
}
```

## Môi trường

Các type không phụ thuộc vào môi trường -- chúng hoạt động trên mọi nền tảng hỗ trợ TypeScript.

## Lưu ý

- **`engine` property** trong `PWChromium` có type `object` -- đây là engine gốc. Bạn chỉ nên dùng nếu cần tác vụ nâng cao không có trong API chính thức.
- **`PublicIPReplacement` và `PrivateIPReplacement`** đều chấp nhận string IP cụ thể. Nếu bạn muốn set IP cố định, chỉ cần truyền `'1.2.3.4'`.
- **`detectExternalIP`** có thể nhận boolean hoặc object `{ v4: boolean, v6: boolean }`. Dùng object nếu bạn muốn cấu hình riêng cho IPv4 và IPv6.
- **`minBrowserVersion: 'current'`** rất tiện -- bạn không cần tra Chrome version hiện tại, engine tự động lấy từ trình duyệt đang chạy.

---
