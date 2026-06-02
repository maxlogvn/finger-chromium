# Product: BrowserEngine

## Tổng quan

`Chromium` singleton là public API chính của thư viện. Dùng fluent pattern để cấu hình và lifecycle.

## Cách dùng đầy đủ

```ts
import { Chromium } from 'fingerprint-chromium-engine';

// 1. Cấu hình
Chromium
  .usePrivateKey(process.env.BABLOSOFT_KEY)
  .useFingerprint(fingerprintJson)
  .useProxy('socks5://127.0.0.1:9050', {
    changeWebRTC: 'replace',
    enableTunneling: true,
  })
  .useProfile('./profiles/user_01', {
    loadProxy: true,
    loadFingerprint: true,
  });

// 2. Launch + tạo context
await Chromium.launch({ headless: false });
const context = await Chromium.newContext();
const page = await context.newPage();

// 3. Dùng page như bình thường
await page.goto('https://example.com');

// 4. Dọn dẹp
await Chromium.quit();
```

## Lifecycle rules

| Gọi method | Khi chưa launch | Sau launch | Sau quit |
|---|---|---|---|
| `launch()` | OK | Throw | OK |
| `newContext()` | Throw | OK | Throw |
| `quit()` | No-op | OK | No-op |
| `useFingerprint()` | OK | OK | OK |
