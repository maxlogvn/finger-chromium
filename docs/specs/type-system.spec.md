# Spec: Hệ thống kiểu

## File structure

| File | Dòng | Export chính |
|---|---|---|
| `src/types/PWChromium.ts` | 164 | `PWChromium` interface -- 9 methods |
| `src/types/fingerprint.ts` | 91 | `FingerprintOptions` -- 9 booleans |
| `src/types/proxy.ts` | 210 | `ProxyOptions` -- 19 fields |
| `src/types/profile.ts` | 30 | `ProfileOptions` -- 2 booleans |
| `src/types/fetch.ts` | 137 | `FetchOptions`, `Time`, `Tag` |
| `src/types/plugin-options.ts` | -- | `PluginOptions` |
| `src/types/config.ts` | -- | `EngineConfig` |

## Chi tiết options

### FingerprintOptions

9 field, tất cả optional boolean. Chỉ `safeElementSize` default `false`, còn lại default `true`.

### ProxyOptions

IPString là branded type `string & {}` -- chỉ để compile-time check. 19 field với cấu trúc:
- Scalar hoặc `{ v4, v6 }` object (cho IPv4/IPv6 riêng)
- Enum dạng string literal union

### FetchOptions

- `Time`: union của 4 string literals
- `Tag`: union của 16 string literals (thiết bị + OS + browser)
- `minBrowserVersion`/`maxBrowserVersion`: number hoặc `'current'`
