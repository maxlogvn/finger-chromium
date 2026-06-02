# Plan: BrowserEngine

## Các bước thực hiện

- [x] **Bước 1: Tạo file `src/adapter/playwright/chromium.ts`**
  - Class `BrowserEngine` implement `PWChromium`.
  - Singleton `const Chromium: PWChromium = new BrowserEngine()`.
  - Export `Chromium`, types (`Launcher`, `PluginLaunchOptions`).

- [x] **Bước 2: Constructor + hằng số môi trường**
  - `PRIVATE_KEY`, `BROWSER_RUNNING_DIR`, `ENGINE_WORKING_DIR` từ env, có fallback default.
  - `DEFAULT_CONTEXT_OPTIONS`: `headless: false`, `hasTouch: true`.
  - Khởi tạo `PlaywrightFingerprintPlugin`, `AdapterDataManager`, `profileData`.

- [x] **Bước 3: Fluent config methods**
  - `useFingerprint(data, options?)` -- lưu `[data, options]`.
  - `useProxy(data, options?)` -- lưu `[data, options]`.
  - `useProfile(dirPath, options?)` -- map profile sang temp, lưu `[tempPath, options]`.
  - `repackChromium(launcher)` -- tạo plugin mới với custom launcher.
  - Tất cả return `this` cho chaining.

- [x] **Bước 4: `launch(options?)`**
  - Chỉ gọi được 1 lần (kiểm tra `isLaunched`).
  - Merge options: `DEFAULT_CONTEXT_OPTIONS` < pre-configured < launch-time.
  - Cấu hình engine: `setServiceKey`, `setWorkingFolder`, `useProfile`, `useProxy`, `useFingerprint`.

- [x] **Bước 5: `newContext(options?)`**
  - Kiểm tra `isLaunched` + context chưa tồn tại.
  - Gọi `engine.launchPersistentContext(profilePath, mergedOptions)`.
  - Return `BrowserContext`.

- [x] **Bước 6: `quit(saveDataPath?)`**
  - No-op nếu chưa launch.
  - Close context, copy temp profile về đích, unmap.
  - Reset `isLaunched`.

- [x] **Bước 7: `newFingerprint(options?)`**
  - Proxy tới `engine.fetch(options)`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/adapter/playwright/chromium.ts` | BrowserEngine class (228 dòng) |
| `src/adapter/playwright/engine.ts` | PlaywrightFingerprintPlugin |
| `src/adapter/playwright/data.ts` | AdapterDataManager (profile mapping) |
| `src/types/PWChromium.ts` | PWChromium interface |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Verify lifecycle: launch → newContext → quit.
- Verify single-launch constraint.
- Verify profile mapping.

---
