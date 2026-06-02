# Plan: Cấu hình Proxy

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa `src/types/proxy.ts`**
  - Interface `ProxyOptions` với 18 fields.
  - `IPString = string & {}` -- branded type cho compile-time checking.
  - Types hỗ trợ: `IPExtractionMethod`, `PrivateIPReplacement`, `PublicIPReplacement`.

- [x] **Bước 2: Implement `useProxy()` trong `FingerprintPlugin`**
  - Lưu `PluginConfig { value: proxyUrl, options: ProxyOptions }`.
  - `validateConfig('proxy', value, options)`.

- [x] **Bước 3: Implement `setProxyFromArguments()`**
  - Parse `--proxy-server=<url>` từ mảng args.
  - Chỉ set nếu proxy chưa được cấu hình (first-call-wins).

- [x] **Bước 4: Tích hợp proxy vào API setup**
  - `{ ..., proxy: { value, options } }` trong `api('setup', ...)`.
  - Engine binary xử lý routing và apply options.

## File liên quan

| File | Vai trò |
|---|---|
| `src/types/proxy.ts` | ProxyOptions interface (210 dòng) |
| `src/plugin/index.ts` | `useProxy()`, `setProxyFromArguments()` |
| `src/plugin/utils.ts` | `validateConfig()` |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Test: `setProxyFromArguments()` sau `useProxy()` không ghi đè.

---
