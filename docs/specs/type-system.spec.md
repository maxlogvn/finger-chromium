# Spec: Hệ thống kiểu (Type System)

## Mô tả

Hệ thống kiểu của thư viện gồm 5 file TypeScript đặt trong `src/types/`. Mỗi file định nghĩa một nhóm interface/type riêng biệt, không phụ thuộc chéo. Tất cả được re-export qua `src/index.ts`.

## File liên quan

| File | Nội dung chính |
|---|---|
| `src/types/PWChromium.ts` | Interface `PWChromium` -- public API |
| `src/types/fingerprint.ts` | Interface `FingerprintOptions` |
| `src/types/proxy.ts` | Interface `ProxyOptions`, type `IPExtractionMethod`, `PublicIPReplacement`, `PrivateIPReplacement` |
| `src/types/profile.ts` | Interface `ProfileOptions` |
| `src/types/fetch.ts` | Interface `FetchOptions`, type `Tag`, `Time` |

## API / Interfaces chính

### `PWChromium` interface

```ts
interface PWChromium {
  // Truy cập engine gốc (cho tác vụ nâng cao)
  readonly engine: object;

  // Thay thế launcher mặc định
  repackChromium(launcher: object): this;

  // Cấu hình
  useFingerprint(data: string, options?: FingerprintOptions): this;
  useProxy(data: string, options?: ProxyOptions): this;
  useProfile(dirPath: string, options?: ProfileOptions): this;

  // Lấy fingerprint mới
  newFingerprint(options: FetchOptions): Promise<string | undefined>;

  // Lifecycle
  launch(options?: Partial<PluginLaunchOptions>): this;
  newContext(options?: Partial<PluginLaunchOptions>): Promise<BrowserContext>;
  quit(saveDataPath?: string): Promise<void>;
}
```

**Lưu ý:** `PluginLaunchOptions` là `Parameters<BrowserType['launchPersistentContext']>[1]` -- trích xuất từ kiểu Playwright, chứa các option như `headless`, `viewport`, `locale`, `timezoneId`...

### `FingerprintOptions`

```ts
interface FingerprintOptions {
  emulateDeviceScaleFactor?: boolean;   // @default true
  emulateSensorAPI?: boolean;            // @default true
  usePerfectCanvas?: boolean;            // @default true
  useFontPack?: boolean;                 // @default true
  safeElementSize?: boolean;             // @default false
  safeBattery?: boolean;                 // @default true
  safeCanvas?: boolean;                  // @default true
  safeAudio?: boolean;                   // @default true
  safeWebGL?: boolean;                   // @default true
}
```

### `ProxyOptions`

```ts
interface ProxyOptions {
  changeBrowserLanguage?: boolean;                    // @default true
  changeGeolocation?: boolean;                        // @default false
  changeTimezone?: boolean;                           // @default true
  changeWebRTC?: 'enable' | 'disable' | 'replace';   // @default 'replace'
  publicIPv4?: PublicIPReplacement;                   // @default 'auto'
  publicIPv6?: PublicIPReplacement;                   // @default 'auto'
  privateIPv4?: PrivateIPReplacement;                 // @default 'local'
  privateIPv6?: PrivateIPReplacement;                 // @default 'local'
  ipExtractionMethod?: IPExtractionMethod | { v4: IPExtractionMethod; v6: IPExtractionMethod }; // @default 'raw'
  ipExtractionParam?: string | { v4: string; v6: string };        // @default ''
  ipExtractionURL?: string | { v4: string; v6: string };          // @default ''
  detectExternalIP?: boolean | { v4: boolean; v6: boolean };      // @default true
  ipInfoMethod?: 'database' | 'ip-api.com';                       // @default 'database'
  ipInfoKey?: string;                                               // @default ''
  enableTunneling?: boolean;                                        // @default true
  enableQUIC?: boolean;                                             // @default false
  dnsMode?: 'system-proxy' | 'custom-proxy' | 'custom-direct';    // @default 'system-proxy'
  dnsIP?: string;                                                   // @default '1.1.1.1'
}
```

### Helper types cho ProxyOptions

```ts
type IPExtractionMethod = 'raw' | 'xpath' | 'regexp' | 'jsonpath';
type PrivateIPReplacement = IPString | 'disable' | 'local';
type PublicIPReplacement = IPString | 'disable' | 'auto';
type IPString = string & {};  // Branded type: bất kỳ string nào
```

### `ProfileOptions`

```ts
interface ProfileOptions {
  loadProxy?: boolean;        // @default true
  loadFingerprint?: boolean;  // @default true
}
```

### `FetchOptions`

```ts
interface FetchOptions {
  tags?: Tag[];                             // VD: ['Chrome', 'Desktop']
  timeLimit?: Time;                         // VD: '30 days'
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minBrowserVersion?: number | 'current';
  maxBrowserVersion?: number | 'current';
  perfectCanvasLogs?: boolean;              // @default false
  perfectCanvasRequest?: string;
  enableCustomServer?: boolean;             // @default false
  dynamicPerfectCanvas?: boolean;           // @default true
  enablePrecomputedFingerprints?: boolean;  // @default true
}
```

### `Tag` type

```ts
type Tag =
  | '*' | 'Desktop' | 'Mobile'
  | 'Microsoft Windows' | 'Apple Mac' | 'Android' | 'Linux' | 'iPad' | 'iPhone'
  | 'Edge' | 'Chrome' | 'Safari' | 'Firefox' | 'YaBrowser'
  | 'Windows 7' | 'Windows 8' | 'Windows 10';
```

### `Time` type

```ts
type Time = '*' | '15 days' | '30 days' | '60 days';
```

## Luồng dữ liệu

### Khi người dùng gọi `useFingerprint(fingerprintData, options)`

```
user code
   │
   ▼
Chromium.useFingerprint(data: string, options?: FingerprintOptions)
   │
   ├── Lưu data + options vào browser.fingerprints
   │
   ▼
Chromium.launch()
   │
   ▼
BrowserEngine gọi engine.useFingerprint(data, options)
   │
   ▼
Plugin chuyển options cho engine binary qua API 'setup'
```

### Khi người dùng gọi `newFingerprint(fetchOptions)`

```
Chromium.newFingerprint(options: FetchOptions)
   │
   ▼
engine.fetch(options) → gọi API backend → trả về fingerprint JSON
```

## Xử lý lỗi

Các type chỉ là định nghĩa -- lỗi xảy ra ở runtime khi giá trị không đúng kiểu mong đợi:

| Lỗi runtime | Nguyên nhân |
|---|---|
| `changeWebRTC` nhận giá trị `true` (boolean) thay vì `'enable' | 'disable' | 'replace'` | Engine không hiểu, fallback về mặc định |
| `dnsMode` nhận `'proxy'` thay vì `'system-proxy'` | Engine set sai chế độ DNS |
| `timeLimit` nhận `'1 month'` thay vì `'30 days'` | Engine không parse được, dùng mặc định |

## Ghi chú kỹ thuật

- `PWChromium.ts` import `PluginLaunchOptions` từ `adapter/playwright/chromium.ts` -- đây là dependency duy nhất từ types ra code. Lý do: `PluginLaunchOptions` là type trích xuất từ Playwright, cần được lấy từ adapter (nơi có Playwright).
- `engine` property trong `PWChromium` có type `object` thay vì type chính xác. Đây là intentional design choice để tránh circular dependency và cho phép thay đổi internal implementation.
- Các type `IPString`, `PublicIPReplacement`, `PrivateIPReplacement` dùng intersection `string & {}` để tạo branded type -- cho phép TypeScript phân biệt IPString với string thường.
- `FetchOptions` không đánh dấu field nào là required -- tất cả đều optional. Nếu không truyền, engine sẽ lấy fingerprint bất kỳ.

---
