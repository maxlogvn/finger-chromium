# Plan: Cấu hình Fingerprint

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa `src/types/fingerprint.ts`**
  - Interface `FingerprintOptions` với 9 boolean fields.
  - 8 fields default `true`, 1 field (`safeElementSize`) default `false`.
  - JSDoc cho mỗi field giải thích tại sao.

- [x] **Bước 2: Implement `useFingerprint()` trong `FingerprintPlugin`**
  - Lưu `PluginConfig { value: fingerprintJson, options: FingerprintOptions }`.
  - Validate bằng `validateConfig('fingerprint', value, options)`.

- [x] **Bước 3: Tích hợp fingerprint vào API setup**
  - `{ ..., fingerprint: { value, options } }` trong `api('setup', ...)`.
  - Engine binary parse và inject ở C level.

- [x] **Bước 4: Hỗ trợ fetch fingerprint qua API**
  - `fetch(FetchOptions)` gọi `api('fetch', { key, options, version })`.
  - Filter theo tags, timeLimit, screen size, browser version.

## File liên quan

| File | Vai trò |
|---|---|
| `src/types/fingerprint.ts` | FingerprintOptions interface |
| `src/plugin/index.ts` | `useFingerprint()` trong FingerprintPlugin |
| `src/plugin/utils.ts` | `validateConfig()` |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Verify: `useFingerprint()` validate value là string.
- Verify: `safeElementSize` default `false` trong JSDoc.

---
