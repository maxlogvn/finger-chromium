# Spec: Hệ thống kiểu (Type System)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Hệ thống 5 file TypeScript types (tổng cộng 5 interface + type helpers) cung cấp contract kiểu cho toàn bộ thư viện. `PWChromium` là interface chính định nghĩa public API, các option types (`FingerprintOptions`, `ProxyOptions`, `ProfileOptions`, `FetchOptions`) là tham số cho từng method.

Source: `src/types/*.ts`.

## Yêu cầu

- `PWChromium` là interface (không phải class) — không thể `new PWChromium()`. Implementation là `BrowserEngine` class — mỗi `new BrowserEngine()` là instance riêng.
- Các option types có JSDoc đầy đủ, ghi rõ `@default`.
- Tất cả public types được re-export từ `src/index.ts`.
- `FetchOptions` dùng cho method `newFingerprint()`.
- File proxy có type helpers: `IPExtractionMethod`, `IPString`, `PublicIPReplacement`, `PrivateIPReplacement`.
- `IPString = string & {}` — branded type để TypeScript nhận dạng IP string.

## Thiết kế

### File structure

```
src/types/
  ├── PWChromium.ts    — Interface chính (fluent API)
  ├── fingerprint.ts   — FingerprintOptions (9 fields)
  ├── proxy.ts         — ProxyOptions (18 fields + type helpers)
  ├── profile.ts       — ProfileOptions (2 fields)
  └── fetch.ts         — FetchOptions (12 fields + Tag, Time)
```

### Tại sao PWChromium là interface?

Interface cho phép người dùng implement custom version mà không cần kế thừa class. Nếu là class, mọi custom implementation phải extends `BrowserEngine` — dính implementation details.

### Tại sao IPString = string & {}?

Branded type — TypeScript coi `IPString` là kiểu riêng biệt với `string`. Ngăn truyền `string` thông thường vào field yêu cầu IP string. Tuy nhiên, ở runtime nó vẫn là `string` — không có overhead.

Tham chiếu design doc: `docs/designs/type-system.design.md`.

## API / Data flow

### PWChromium — Interface chính

```ts
export interface PWChromium {
  readonly engine: object;
  repackChromium(launcher: object): this;
  useFingerprint(data: string, options?: object): this;
  useProxy(data: string, options?: object): this;
  useProfile(dirPath: string, options?: object): this;
  newFingerprint(options: FetchOptions): Promise<string | undefined>;
  launch(options?: object): this;
  newContext(options?: Partial<PluginLaunchOptions>): Promise<BrowserContext>;
  quit(saveDataPath?: string): Promise<void>;
}
```

### FingerprintOptions — 9 fields

| Field | Type | Default |
|---|---|---|
| `emulateDeviceScaleFactor` | `boolean` | `true` |
| `emulateSensorAPI` | `boolean` | `true` |
| `usePerfectCanvas` | `boolean` | `true` |
| `useFontPack` | `boolean` | `true` |
| `safeElementSize` | `boolean` | `false` |
| `safeBattery` | `boolean` | `true` |
| `safeCanvas` | `boolean` | `true` |
| `safeAudio` | `boolean` | `true` |
| `safeWebGL` | `boolean` | `true` |

### ProxyOptions — 18 fields + type helpers

Xem chi tiết tại [proxy-config.spec.md](proxy-config.spec.md). Các field đáng chú ý:

- `ipExtractionMethod`: `IPExtractionMethod | { v4: IPExtractionMethod; v6: IPExtractionMethod }` — object notation cho cấu hình riêng IPv4/IPv6.
- `privateIPv4`: `PrivateIPReplacement | 'private class a' | 'private class b' | 'private class c'` — union type cho IP nội bộ.
- `privateIPv6`: `PrivateIPReplacement | 'unique local address'`.
- `dnsMode`: `'system-proxy' | 'custom-proxy' | 'custom-direct'`.

### ProfileOptions — 2 fields

| Field | Type | Default |
|---|---|---|
| `loadProxy` | `boolean` | `true` |
| `loadFingerprint` | `boolean` | `true` |

### FetchOptions — 12 fields + Tag + Time

| Field | Type | Default |
|---|---|---|
| `tags` | `Tag[]` | — |
| `timeLimit` | `Time` | — |
| `minWidth` / `maxWidth` | `number` | — |
| `minHeight` / `maxHeight` | `number` | — |
| `minBrowserVersion` / `maxBrowserVersion` | `number \| 'current'` | — |
| `perfectCanvasLogs` | `boolean` | `false` |
| `perfectCanvasRequest` | `string` | — |
| `enableCustomServer` | `boolean` | `false` |
| `dynamicPerfectCanvas` | `boolean` | `true` |
| `enablePrecomputedFingerprints` | `boolean` | `true` |

## Components

| File | Vai trò | Độ dài |
|---|---|---|
| `src/types/PWChromium.ts` | Interface chính — fluent API methods | 164 dòng |
| `src/types/fingerprint.ts` | `FingerprintOptions` | 91 dòng |
| `src/types/proxy.ts` | `ProxyOptions` + type helpers | 210 dòng |
| `src/types/profile.ts` | `ProfileOptions` | 30 dòng |
| `src/types/fetch.ts` | `FetchOptions` + `Tag` + `Time` | 137 dòng |

### Export từ src/index.ts

```ts
export { type PWChromium } from './types/PWChromium';
export {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from './plugin/errors';
export {
  BrowserEngine,
  type FetchOptions,
  type FingerprintOptions,
  type Launcher,
  type PluginLaunchOptions,
  type ProfileOptions,
  type ProxyOptions,
} from './adapter/playwright/chromium';
```

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Dùng sai type (vd: `changeWebRTC: true` thay vì `'replace'`) | TypeScript báo lỗi compile — runtime không throw |
| Truyền `IPString` thay vì `string` | Compile error nếu dùng sai — runtime là `string` |
| Dùng `PWChromium` làm class (`new PWChromium()`) | TypeScript báo lỗi — interface không thể new |

## Kiểm tra

- Happy path: import đúng type, compile pass.
- Edge case: `changeWebRTC: 'replace'` — string literal type, compile check.
- Edge case: `ipExtractionMethod: { v4: 'raw', v6: 'xpath' }` — object notation.
- Error: truyền `changeWebRTC: true` (boolean) — TypeScript báo type error.
- Export: tất cả public types re-export từ `src/index.ts` đúng.
