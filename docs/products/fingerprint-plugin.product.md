# Product: FingerprintPlugin

## Tổng quan

FingerprintPlugin là orchestrator trung tâm. Nó quản lý cấu hình (fingerprint, proxy, profile), gọi API setup tới engine binary, spawn worker.exe, và dọn dẹp sau khi browser đóng.

## Vòng đời đầy đủ

```
        useFingerprint() → useProxy() → useProfile()
                 ↓
           _launch(options)
                 ↓
      ┌─ api('setup') ─ gửi config
      ├─ cleaner.watch + mutex.create
      ├─ spawn worker.exe
      ├─ configure() → resize viewport
      └─ return Browser / BrowserContext
                 ↓
           user dùng page
                 ↓
           cleanup: close + include + unlock
```

## Cách dùng trực tiếp

```ts
const plugin = new FingerprintPlugin();

plugin
  .useFingerprint(fingerprintString, {
    usePerfectCanvas: true,
    safeWebGL: true,
  })
  .useProxy('http://proxy:8080', {
    changeWebRTC: 'replace',
  })
  .useBrowserVersion('default');

// Fetch fingerprint từ service
const fp = await plugin.fetch({
  tags: ['Desktop', 'Chrome'],
  timeLimit: '30 days',
});

// Lấy danh sách version có sẵn
const versions = await plugin.versions('default');
```

## 2 đường dẫn launch

Plugin hỗ trợ 2 chế độ:

1. **Direct spawn** (`useDefaultLauncher=true`): spawn `worker.exe` trực tiếp, dùng khi không có Playwright
2. **Playwright bridge** (`useDefaultLauncher=false`): dùng `pwLauncher.launchPersistentContext()`, trả về `BrowserContext`

Chế độ 2 được dùng bởi `PlaywrightFingerprintPlugin` (trong `engine.ts`).

## Key module-level

`setServiceKey()` lưu key ở module level -- tất cả instance đều dùng chung. Key có thể set 1 lần, dùng cho mọi lần launch sau.
