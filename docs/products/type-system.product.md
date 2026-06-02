# Product: Hệ thống kiểu (Type System)

## Mô tả

Hệ thống 5 file TypeScript types cung cấp interface và option types cho toàn bộ thư viện. `PWChromium` là interface chính, các `FingerprintOptions`, `ProxyOptions`, `ProfileOptions`, `FetchOptions` là option types cho từng tính năng.

## Cách sử dụng

```ts
import {
  Chromium,
  type PWChromium,
  type FingerprintOptions,
  type ProxyOptions,
  type ProfileOptions,
  type FetchOptions,
} from 'fingerprint-chromium-engine';

// Dùng FingerprintOptions với satisfies
Chromium.useFingerprint(data, {
  usePerfectCanvas: true,
  safeWebGL: true,
} satisfies FingerprintOptions);

// Dùng ProxyOptions
Chromium.useProxy('http://user:pass@host:8080', {
  changeTimezone: true,
  changeWebRTC: 'replace',
} satisfies ProxyOptions);
```

## Hành vi chi tiết

- `PWChromium` là **interface** — không thể `new PWChromium()`. Dùng singleton `Chromium`.
- `Chromium.newFingerprint()` nhận `FetchOptions`, trả về `Promise<string | undefined>`.
- `IPString = string & {}` là branded type — đảm bảo giá trị truyền vào là string nhưng TypeScript vẫn nhận dạng được là IP string.
- Các field có `@default` trong JSDoc — nếu không truyền, engine dùng giá trị mặc định.
- 5 file types được export public từ `src/index.ts`. Internal types không được re-export.

## Giới hạn và điều kiện

- Chỉ 5 file type được export public: `PWChromium`, `FingerprintOptions`, `ProxyOptions`, `ProfileOptions`, `FetchOptions`.
- `ProxyOptions.dnsMode` chỉ có hiệu lực khi proxy đã được cấu hình.
- `FingerprintOptions.safeElementSize` mặc định `false`.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/type-system.spec.md`
- Design: `docs/designs/type-system.design.md`
- Source: `src/types/*.ts`
