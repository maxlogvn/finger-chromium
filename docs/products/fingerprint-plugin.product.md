# Product: FingerprintPlugin

## Tổng quan

`FingerprintPlugin` là lớp điều phối trung tâm của toàn bộ thư viện. Nó quản lý cấu hình (fingerprint, proxy, profile), gọi API tới engine binary để thiết lập môi trường, spawn worker.exe, resize viewport, và dọn dẹp tài nguyên sau khi browser đóng.

Bạn có thể dùng `FingerprintPlugin` trực tiếp (standalone) hoặc qua `PlaywrightFingerprintPlugin` (tích hợp Playwright).

## Vòng đời

```
User config: useFingerprint() → useProxy() → useProfile()
                          ↓
                     spawn(options)
                          ↓
        ┌── 1. setProxyFromArguments() ── fallback từ args
        │  2. api('setup') ─── gửi config xuống engine
        │  3. cleaner.watch() + mutex.create() ── bảo vệ tài nguyên
        │  4. Chọn launcher ── default (spawn) hoặc custom (Playwright)
        │  5. activeLauncher.launch() ── spawn worker.exe
        └── 6. configure() ── resize viewport + sync .ini
                          ↓
                    Return Browser
                          ↓
                    User dùng page
                          ↓
                    Cleanup tự động
```

## API chính

### Configuration

```ts
const plugin = new FingerprintPlugin();

plugin
  .useFingerprint(fpString, { usePerfectCanvas: true, safeWebGL: true })
  .useProxy('http://user:pass@proxy:8080', { changeWebRTC: 'replace' })
  .useProfile('./profiles/myprofile', { loadProxy: true })
  .useBrowserVersion('120');
```

### Service Key (module-level)

```ts
plugin.setServiceKey('your-bablosoft-key');
// Tất cả instance chia sẻ cùng key này
```

### Fetch Fingerprint từ Service

```ts
const fingerprintData = await plugin.fetch({
  tags: ['Desktop', 'Chrome', 'Windows'],
  timeLimit: '30 days',
  quantity: 1,
});
```

### Lấy Danh Sách Version

```ts
const versions = await plugin.versions('default');       // string[]
const versionsExt = await plugin.versions('extended');   // Version[]
```

### Spawn Browser

```ts
const browser = await plugin.spawn({
  args: ['--disable-gpu', '--no-sandbox'],
  devtools: false,
});
// Browser có process, configure, close
```

## 2 Đường Dẫn Launch

| Chế độ | `useDefaultLauncher` | Launcher | Dùng khi nào |
|---|---|---|---|
| **Direct spawn** | `true` | Plugin's `launch()` | Standalone, không Playwright |
| **Playwright bridge** | `false` | Custom (từ options) | `PlaywrightFingerprintPlugin` |

Ở chế độ bridge, `configure()` được override để nhận `BrowserContext` thay vì `Browser`.

## Lưu ý

- `headless: false` luôn được force -- fingerprint check phát hiện headless.
- `serviceKey` là global -- gọi `setServiceKey()` trên bất kỳ instance nào cũng ảnh hưởng tất cả.
- Profile có fallback tự động nếu không gọi `useProfile()`: engine tự tìm `--user-data-dir` từ args.
- Mutex name `BASProcess${pid}` dùng `randomUUID()` -- mỗi lần launch một mutex riêng, không conflict.

---
