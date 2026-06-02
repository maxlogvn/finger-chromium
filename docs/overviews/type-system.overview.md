# Overview: Hệ thống Kiểu (Type System)

## Tóm tắt

Đã tạo 5 file TypeScript types: `PWChromium.ts` (interface chính), `fingerprint.ts` (FingerprintOptions), `proxy.ts` (ProxyOptions + branded IPString), `profile.ts` (ProfileOptions), `fetch.ts` (FetchOptions + Tag + Time). Tất cả public types được re-export từ `src/index.ts`.

## Kiến trúc

```
src/types/
  |-- PWChromium.ts     -> PWChromium interface (9 methods)
  |-- fingerprint.ts    -> FingerprintOptions (9 fields)
  |-- proxy.ts          -> ProxyOptions (18 fields) + type helpers
  |-- profile.ts        -> ProfileOptions (2 fields)
  |-- fetch.ts          -> FetchOptions + Tag + Time
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `PWChromium` interface | `src/types/PWChromium.ts` | 38-164 |
| `FingerprintOptions` | `src/types/fingerprint.ts` | 18-91 |
| `ProxyOptions` | `src/types/proxy.ts` | 14-210 |
| `IPString` branded type | `src/types/proxy.ts` | 16 |
| `IPExtractionMethod` | `src/types/proxy.ts` | 18 |
| `ProfileOptions` | `src/types/profile.ts` | 16-30 |
| `FetchOptions` + `Tag` + `Time` | `src/types/fetch.ts` | 1-42 |

## PWChromium interface (9 methods)

```ts
interface PWChromium {
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

## Quyết định thiết kế

- **`PWChromium` là interface, không phải type alias**: Interface cho phép declaration merging -- user có thể mở rộng. `type` không thể merge.
- **`IPString = string & {}` branded type**: Zero-cost type safety. `{}` = non-nullish object. Intersection `string & {}` = string. TypeScript không cho gán raw string -- ép user cast.
- **Object notation cho complex fields**: `ipExtractionMethod?: IPExtractionMethod | { v4: IPExtractionMethod; v6: IPExtractionMethod }`. Cho phép cấu hình IPv4/IPv6 riêng.
- **`as const` cho constants**: `DEFAULT_ERROR_MESSAGES` dùng `as const` -- TypeScript infer literal type, không mutate.
- **Return `this` (Fluent API)**: Method chain -- user gọi liên tiếp `.useFingerprint().useProxy().useProfile()`.

## Sai lệch đã biết

- `PWChromium.ts` JSDoc tham chiếu method `usePrivateKey()` không tồn tại trong interface -- đã ghi nhận tại KNOWN_ISSUES.md #4. Chỉ là code comment, không ảnh hưởng API.
- Plan ghi `ProxyOptions` có 17 fields, nhưng thực tế code có 18 fields -- thiếu field `dnsIP`. Đã sửa tại `docs/plans/type-system.plan.md`.

## Lưu ý

- 5 files, 5 interfaces, 3 type aliases.
- `PWChromium` là interface (không type) -- declaration merging.
- `IPString` là branded type -- zero runtime cost.
- Object notation cho `ipExtractionMethod`, `ipExtractionParam`, `ipExtractionURL`, `detectExternalIP`.
- Tất cả public types được re-export từ `src/index.ts`.

## Tài liệu liên quan

- `docs/designs/type-system.design.md`
- `docs/specs/type-system.spec.md`
- `docs/plans/type-system.plan.md`
- `docs/products/type-system.product.md`
- `src/types/PWChromium.ts`
- `src/types/fingerprint.ts`
- `src/types/proxy.ts`
- `src/types/profile.ts`
- `src/types/fetch.ts`
