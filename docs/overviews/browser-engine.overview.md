# Overview: BrowserEngine

## Mục tiêu

Tạo singleton class `BrowserEngine` với fluent API, là public API chính của thư viện, cho phép cấu hình fingerprint/proxy/profile -> launch -> tạo context -> quit.

## Kết quả

- `src/adapter/playwright/chromium.ts`: 228 dòng, class `BrowserEngine` implement `PWChromium`.
- Export singleton `Chromium`, types `Launcher`, `PluginLaunchOptions`.
- 5 fluent config methods, 3 lifecycle methods, 1 utility method (`newFingerprint`).

## Kiểm tra

- `npm run lint` -- 0 errors (không có warning mới).

## Sai lệch so với kế hoạch

Kế hoạch cũ đề cập method `usePrivateKey()` nhưng code không có -- key được set qua constructor default từ env `BABLOSOFT_KEY`. Kế hoạch cũ cũng nói `engine._launch(false, ...)` được gọi từ `launch()` nhưng thực tế `launch()` chỉ config engine, `_launch()` được gọi qua `engine.launchPersistentContext()` trong `newContext()`.

## Ghi chú kỹ thuật

### `launch()` config trước, `newContext()` spawn sau

Code tách biệt rõ: `launch()` chỉ config engine (set service key, working folder, profile, proxy, fingerprint), không spawn. `newContext()` mới thực sự gọi `engine.launchPersistentContext()` để spawn worker.exe và tạo BrowserContext.

### `repackChromium()` không reset config

```ts
repackChromium(launcher: Launcher): this {
  this.engine = new PlaywrightFingerprintPlugin(launcher);
  return this;
}
```

Tạo `PlaywrightFingerprintPlugin` mới, nhưng config (fingerprint, proxy, profile) được lưu trong `BrowserEngine` instance. Khi `launch()` được gọi sau, config cũ được áp dụng lại.

### Profile mapping 2 chiều

- `useProfile(dirPath)` -> `dataManager.map(dirPath)` copy từ gốc sang temp.
- `quit(saveDataPath?)` -> `dataManager.map(tempPath, targetSavePath)` copy từ temp về gốc.
- `saveProfileDirPath` lưu path gốc user nhập. `profileData` lưu `[tempPath, options]`.

### `DEFAULT_CONTEXT_OPTIONS: { headless: false, hasTouch: true }`

- `headless: false`: fingerprint check phát hiện headless browser.
- `hasTouch: true`: giả lập thiết bị cảm ứng, tránh fingerprint check phát hiện thiếu touch support.

### Env fallback defaults

| Biến | Default nếu không set |
|---|---|
| `BABLOSOFT_KEY` | `''` (empty string) |
| `BROWSER_RUNNING_DIR` | `path.join(process.cwd(), '.tmp/browser/running')` |
| `ENGINE_WORKING_DIR` | `path.join(process.cwd(), '.tmp/browser/engine')` |

### `quit()` an toàn gọi nhiều lần

Guard `if (!this.isLaunched) return;` ở đầu method -- nếu chưa launch hoặc đã quit, không làm gì. Nếu context chưa được tạo (chỉ mới launch, chưa newContext), bỏ qua bước close + save profile.

### `saveDataPath` trong `quit()` ghi đè destination

Tham số `saveDataPath` cho phép lưu profile vào đường dẫn khác với đường dẫn gốc từ `useProfile()`. Nếu không truyền, dùng `this.saveProfileDirPath`.

---
