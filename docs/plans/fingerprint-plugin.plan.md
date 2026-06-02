# Plan: FingerprintPlugin

## Các bước thực hiện

- [x] **Bước 1: Tạo file `src/plugin/index.ts`**
  - Module-level: `serviceKey` (global), `plugin` (singleton).
  - Class `FingerprintPlugin` với properties: `launcher`, `version`, `fingerprint`, `profile`, `proxy`.

- [x] **Bước 2: Constructor + Factory**
  - Constructor nhận optional launcher, fallback về mặc định.
  - `static create()` validate launcher rồi gọi constructor.

- [x] **Bước 3: Fluent Configuration**
  - `useFingerprint()` validate + lưu fingerprint.
  - `useProfile()` validate + lưu profile path.
  - `useProxy()` validate + lưu proxy URL.
  - `useBrowserVersion()` set version string.
  - Tất cả return `this` cho chaining.

- [x] **Bước 4: Config Helpers**
  - `setProxyFromArguments()` -- fallback parse `--proxy-server`.
  - `setWorkingFolder()`, `setRequestTimeout()`, `setEngineTimeout()`, `setServiceKey()` -- proxy methods.

- [x] **Bước 5: Runtime API**
  - `fetch()` -- gọi `api('fetch', ...)`.
  - `versions()` -- gọi `api('versions', ...)`.
  - `spawn()` -- gọi `_launch(true, ...)`.

- [x] **Bước 6: Core `_launch()`**
  - Extract proxy từ args.
  - Gọi `api('setup')` → `SetupResponse`.
  - Register cleaner + create mutex.
  - Chọn launcher (default vs custom).
  - Spawn worker.exe với args đã lọc.

- [x] **Bước 7: Configure + Synchronize**
  - `configure()` pass-through tới `config.ts`.
  - Resize viewport + đồng bộ availWidth/availHeight.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/index.ts` | Class chính (282 dòng) |
| `src/plugin/config.ts` | Configure + synchronize .ini |
| `src/plugin/browser.ts` | CDP viewport resize |
| `src/plugin/utils.ts` | defaultArgs, getProfilePath, validate |
| `src/plugin/launcher/index.ts` | Spawn browser process |
| `src/plugin/connector/index.ts` | API engine (setup, fetch, versions) |
| `src/plugin/mutex/index.ts` | Windows named mutex |
| `src/plugin/cleaner.ts` | File cleanup daemon |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Cần engine binary thật để test `_launch()`.
- Test edge cases: proxy từ args sau useProxy, profile fallback.

---
