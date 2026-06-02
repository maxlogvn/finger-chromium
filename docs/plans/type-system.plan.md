# Plan: Hệ thống kiểu (Type System)

## Các bước thực hiện

- [x] **Bước 1: Tạo `src/types/PWChromium.ts`**
  - Định nghĩa interface `PWChromium` với các method: `repackChromium`, `useFingerprint`, `useProxy`, `useProfile`, `launch`, `newContext`, `newFingerprint`, `quit`. (Private key set qua env `BABLOSOFT_KEY` hoặc constructor, không phải method riêng.)
  - Mỗi method có JSDoc đầy đủ: mô tả, @param, @returns, @throws, @example.
  - Import `BrowserContext` từ `playwright-core` và `PluginLaunchOptions` từ `../adapter/playwright/chromium`.
  - `engine` property type là `object` (tránh circular dependency).

- [x] **Bước 2: Tạo `src/types/fingerprint.ts`**
  - Định nghĩa interface `FingerprintOptions` với 9 fields boolean.
  - Mỗi field có JSDoc giải thích tác dụng và @default value.
  - Các field: `emulateDeviceScaleFactor`, `emulateSensorAPI`, `usePerfectCanvas`, `useFontPack`, `safeElementSize`, `safeBattery`, `safeCanvas`, `safeAudio`, `safeWebGL`.
  - `safeElementSize` mặc định `false` -- các field còn lại mặc định `true`.

- [x] **Bước 3: Tạo `src/types/proxy.ts`**
  - Định nghĩa type `IPExtractionMethod` (`'raw' | 'xpath' | 'regexp' | 'jsonpath'`).
  - Định nghĩa type `PrivateIPReplacement` (`IPString | 'disable' | 'local'`).
  - Định nghĩa type `PublicIPReplacement` (`IPString | 'disable' | 'auto'`).
  - Định nghĩa type `IPString` (branded type `string & {}`).
  - Định nghĩa interface `ProxyOptions` với 17 fields: language, geolocation, timezone, WebRTC, IP, DNS, tunneling, QUIC.
  - Các field phức tạp (IP extraction, detect external IP) hỗ trợ object notation `{ v4: ..., v6: ... }`.

- [x] **Bước 4: Tạo `src/types/profile.ts`**
  - Định nghĩa interface `ProfileOptions` với 2 fields boolean: `loadProxy`, `loadFingerprint`.
  - Cả hai mặc định `true`.

- [x] **Bước 5: Tạo `src/types/fetch.ts`**
  - Định nghĩa type `Time`: `'*' | '15 days' | '30 days' | '60 days'`.
  - Định nghĩa type `Tag`: 17 giá trị union.
  - Định nghĩa interface `FetchOptions` với 13 fields: tags, timeLimit, screen size, browser version, PerfectCanvas, custom server, dynamic PerfectCanvas, precomputed fingerprints.

- [x] **Bước 6: Export từ `src/index.ts`**
  - Thêm dòng `export { type PWChromium } from './types/PWChromium';`
  - Các type còn lại được re-export từ `./adapter/playwright/chromium`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/types/PWChromium.ts` | Interface public API chính |
| `src/types/fingerprint.ts` | Tùy chọn fingerprint |
| `src/types/proxy.ts` | Tùy chọn proxy |
| `src/types/profile.ts` | Tùy chọn profile |
| `src/types/fetch.ts` | Bộ lọc fingerprint |
| `src/index.ts` | Re-export tất cả type công khai |

## Kiểm tra

- `npm run lint` -- 0 errors (các type không có lỗi ESLint)
- `tsc --noEmit` -- TypeScript compile không lỗi (kiểm tra type consistency)

## Ghi chú

- `PWChromium.ts` phụ thuộc vào `PluginLaunchOptions` từ adapter. Đây là dependency một chiều -- type không phụ thuộc vào logic.
- `IPString` dùng branded type `string & {}` để TypeScript phân biệt với string thường. Không ảnh hưởng đến runtime.
- `privateIPv4` và `privateIPv6` có thêm giá trị `'private class a' | 'private class b' | 'private class c'` và `'unique local address'` -- các giá trị này đến từ engine binary, được giữ để tương thích.
- Tất cả các default values được ghi trong JSDoc (`@default`). Khi gọi API, nếu không truyền option, engine binary tự áp dụng default của nó.

---
