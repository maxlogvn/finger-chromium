# Product: Hệ thống kiểu

## Tổng quan

Type definitions cho tất cả options. TypeScript strict mode, không dùng `any`.

## Interface chính

### PWChromium

Interface fluent API với 9 methods. Toàn bộ lifecycle đều type-safe:

```ts
export interface PWChromium {
  readonly engine: object;
  repackChromium(launcher: Launcher): this;
  useFingerprint(data: string, options?: FingerprintOptions): this;
  useProxy(data: string, options?: ProxyOptions): this;
  useProfile(dirPath: string, options?: ProfileOptions): this;
  newFingerprint(options: FetchOptions): Promise<string | undefined>;
  launch(options?: PluginLaunchOptions): this;
  newContext(options?: PluginLaunchOptions): Promise<BrowserContext>;
  quit(saveDataPath?: string): Promise<void>;
}
```

### FetchOptions & Time & Tag

Dùng để lọc fingerprint từ service:

```ts
type Time = '*' | '15 days' | '30 days' | '60 days';
type Tag = '*' | 'Desktop' | 'Mobile' | 'Chrome' | 'Firefox' | ...;
```

`minBrowserVersion: 'current'` là magic value -- engine tự match với version trình duyệt đang cài.

### Branded type IPString

```ts
type IPString = string & {};
```

Runtime vẫn là string, chỉ TypeScript phân biệt. Giúp tránh truyền nhầm regular string vào IP field.

### ProxyOptions (19 fields)

Các option dạng `{ v4, v6 }` cho IPv4/IPv6 riêng:

```ts
detectExternalIP: true;
// Hoặc
detectExternalIP: { v4: true, v6: false };
```

## Lưu ý

- Tất cả interface đều optional -- engine dùng giá trị mặc định nếu không set
- `safeElementSize` là field duy nhất default `false` trong FingerprintOptions
- `changeGeolocation` default `false` trong ProxyOptions (cần permission)
- Enum dùng string literal union -- IDE autocomplete tốt
