# Product: BrowserEngine

## Tổng quan

`Chromium` là singleton public API -- điểm vào duy nhất bạn cần. Dùng fluent pattern để cấu hình và lifecycle.

## Ví dụ đầy đủ

```ts
import { Chromium } from 'fingerprint-chromium-engine';

// --- Cấu hình ---
Chromium
  .usePrivateKey(process.env.BABLOSOFT_KEY)
  .useFingerprint(fingerprintJson, {
    usePerfectCanvas: true,
    safeWebGL: true,
    safeCanvas: true,
  })
  .useProxy('socks5://127.0.0.1:9050', {
    changeWebRTC: 'replace',
    enableTunneling: true,
    dnsMode: 'custom-direct',
  })
  .useProfile('./profiles/my_profile', {
    loadProxy: true,
    loadFingerprint: true,
  });

// --- Launch ---
await Chromium.launch({
  headless: false,
  args: ['--disable-web-security'],
});

// --- Lấy context ---
const context = await Chromium.newContext();
const page = await context.newPage();
await page.goto('https://example.com');
console.log(await page.title());

// --- Dọn dẹp ---
await Chromium.quit();
```

## Lifecycle rules

| Gọi method | Khi chưa launch | Sau launch | Sau quit |
|---|---|---|---|
| `launch()` | OK | Throw (1 lần) | OK |
| `newContext()` | Throw | OK (1 lần) | Throw |
| `quit()` | No-op | OK | No-op |
| `useFingerprint()` | OK | OK | OK |
| `useProxy()` | OK | OK | OK |
| `useProfile()` | OK | OK | OK |

## Profile safety

Khi bạn gọi `useProfile('./profiles/user')`, dữ liệu được:

1. **Copy** vào thư mục tạm `<BROWSER_RUNNING_DIR>/profile/<timestamp>_<random>/`
2. **Browser chạy trên bản copy** -- không corrupt dữ liệu gốc
3. **Khi quit**: copy ngược lại thư mục gốc, xoá thư mục tạm

Nếu browser crash, profile gốc vẫn an toàn. Thư mục tạm được CleanupDaemon dọn sau.

## Custom launcher

Bạn có thể thay thế Playwright launcher mặc định bằng `repackChromium()`:

```ts
import { Chromium } from 'fingerprint-chromium-engine';
import { chromium } from 'playwright-extra';

Chromium.repackChromium({
  launch: (opts) => chromium.launch(opts),
  launchPersistentContext: (dir, opts) => chromium.launchPersistentContext(dir, opts),
});
```

**Lưu ý**: gọi `repackChromium()` sẽ reset toàn bộ config -- cần set lại fingerprint/proxy/profile.

## Môi trường

| Biến | Mục đích |
|---|---|
| `BABLOSOFT_KEY` | Key bảo mật |
| `BROWSER_RUNNING_DIR` | Thư mục tạm cho browser (mặc định `temp`) |
| `ENGINE_WORKING_DIR` | Thư mục làm việc engine (mặc định `data`) |
