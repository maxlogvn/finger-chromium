# Overview: BrowserEngine -- Fluent API

## Tóm tắt

`BrowserEngine` là public API chính của thư viện, implement `PWChromium` interface qua singleton `Chromium`. Dùng Fluent API để user đăng ký fingerprint, proxy, profile, rồi launch trình duyệt và tạo `BrowserContext`.

## Kiến trúc

```
BrowserEngine (Chromium instance)
  |-- AdapterDataManager      (profile temp mapping)
  |-- PlaywrightFingerprintPlugin (engine orchestrator)
  |     |-- FingerprintPlugin  (core logic)
  |     |-- ConnectorAPI       (engine IPC)
  |     |-- RemoteEngine       (download + spawn engine binary)
  |-- Playwright BrowserType   (chromium.launch, etc.)
```

**Flow config:**
```
user -> Chromium.useFingerprint()  -> this.fingerprints = [data, opts]
     -> Chromium.useProxy()        -> this.proxy = [data, opts]
     -> Chromium.useProfile()      -> profileDataManager.map() -> plugin
     -> Chromium.repackChromium()  -> this.launcher = customLauncher
     -> Chromium.launch()          -> merge options -> plugin._launch()
     -> Chromium.newContext()      -> plugin.launchPersistentContext()
     -> Chromium.quit()            -> close context -> save profile -> engine.cleanup()
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| Class declaration | `src/adapter/playwright/chromium.ts` | 34-53 |
| Constructor + fields | `src/adapter/playwright/chromium.ts` | 55-99 |
| `useFingerprint()` | `src/adapter/playwright/chromium.ts` | 101-105 |
| `useProxy()` | `src/adapter/playwright/chromium.ts` | 107-111 |
| `useProfile()` | `src/adapter/playwright/chromium.ts` | 113-126 |
| `useBrowserVersion()` | `src/adapter/playwright/chromium.ts` | 128-132 |
| `repackChromium()` | `src/adapter/playwright/chromium.ts` | 134-138 |
| `launch()` | `src/adapter/playwright/chromium.ts` | 140-153 |
| `newContext()` | `src/adapter/playwright/chromium.ts` | 155-215 |
| `newFingerprint()` | `src/adapter/playwright/chromium.ts` | 217-227 |
| `quit()` | `src/adapter/playwright/chromium.ts` | 229-273 |
| PWChromium interface | `src/types/PWChromium.ts` | 38-164 |

## Quyết định thiết kế

- **Singleton `Chromium`**: Một instance toàn cục để đảm bảo `AdapterDataManager` và engine state là duy nhất -- tránh conflict profile.
- **Fluent API, không async cho config**: Config methods (`useFingerprint`, `useProxy`) throw đồng bộ -- user biết lỗi ngay, không đợi launch.
- **`launch()` guard**: Biến `_launched` kiểm tra một lần -- gọi lại throw. Lý do: engine binary chỉ spawn một lần, không thể reset.
- **`DEFAULT_CONTEXT_OPTIONS`**: `headless: false` -- một số fingerprint check phát hiện headless mode. `hasTouch: true` -- browser trông như thiết bị cảm ứng hơn.
- **Profile map sang temp**: `AdapterDataManager.map()` copy profile vào temp trước khi launch -- tránh corrupt profile gốc.

## Quyết định quan trọng: không có `usePrivateKey()`

`BrowserEngine` không có method `usePrivateKey()` -- key được lấy từ biến môi trường `BABLOSOFT_KEY` qua constant `PRIVATE_KEY`. Đây là thay đổi từ phiên bản cũ, docs trước đây vẫn còn đề cập method này.

## Flow launch chi tiết (`_launch()`)

1. `this.engine.usePrivateKey(this.privateKey)` -- set key từ `BABLOSOFT_KEY`
2. `this.engine.useProfile(...this.profileData)` -- relay profile
3. `this.engine.useProxy(...this.proxy)` -- relay proxy
4. `this.engine.useFingerprint(...this.fingerprints)` -- relay fingerprint
5. `this.engine.launch({ ...DEFAULT_LAUNCH_OPTIONS, ...options })` -- launch engine

## Lưu ý

- `quit()` có thể gọi nhiều lần -- return sớm nếu chưa launch.
- `saveDataPath` trong `quit()` ghi đè path trong `useProfile()` -- cho phép snapshot profile.
- `newContext()` chỉ cho một context tại một thời điểm -- cần `quit()` trước khi tạo mới.
- `PWChromium.ts` JSDoc vẫn còn tham chiếu `usePrivateKey()` trong example -- cần sửa code comment riêng.

## Tài liệu liên quan

- `docs/designs/browser-engine.design.md`
- `docs/specs/browser-engine.spec.md`
- `docs/plans/browser-engine.plan.md`
- `docs/products/browser-engine.product.md`
- `src/adapter/playwright/chromium.ts`
- `src/types/PWChromium.ts`
