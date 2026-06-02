# Product: Playwright Bridge

## Tổng quan

`PlaywrightFingerprintPlugin` là cầu nối giữa `FingerprintPlugin` và Playwright. Nó cho phép bạn dùng `launchPersistentContext()` quen thuộc của Playwright, trong khi fingerprint, proxy, và profile được engine binary quản lý.

## Cách dùng

```ts
import { PlaywrightFingerprintPlugin } from 'fingerprint-chromium-engine/adapter/playwright/engine';

const plugin = new PlaywrightFingerprintPlugin();

// Cấu hình giống FingerprintPlugin
plugin
  .useFingerprint(fpString, { usePerfectCanvas: true })
  .useProxy('http://user:pass@proxy:8080', { changeWebRTC: 'replace' })
  .useProfile('./profiles/myprofile');

// Launch persistent context -- API giống Playwright
const context = await plugin.launchPersistentContext('', {
  key: process.env.BABLOSOFT_KEY,
  args: ['--disable-web-security', '--no-sandbox'],
});

const page = await context.newPage();
await page.goto('https://example.com');
```

## So sánh với Playwright gốc

| Playwright gốc | Playwright Bridge |
|---|---|
| `browserType.launchPersistentContext(dir, opts)` | `plugin.launchPersistentContext(dir, opts)` |
| Tự động quản lý profile | Engine quản lý profile |
| Viewport tự do thay đổi | Viewport bị lock bởi fingerprint |
| Proxy qua option | Proxy qua `useProxy()` |
| Không fingerprint | Có fingerprint injection |

## Options không hỗ trợ

| Option | Lý do | Thay bằng |
|---|---|---|
| `proxy` | Engine binary quản lý proxy riêng | `useProxy()` |
| `channel` | Chỉ hỗ trợ Chromium mặc định | -- |
| `firefoxUserPrefs` | Chỉ Firefox mới có | -- |

## Viewport tự động

Mỗi page mới tạo qua `context.newPage()` sẽ tự động resize theo fingerprint.
`page.setViewportSize()` bị chặn (chỉ in warning) -- viewport đã bị fingerprint lock.

## Luồng xử lý

```
1. launchPersistentContext('', options)
2. #validateOptions(options) -- throw nếu có proxy/channel/firefoxUserPrefs
3. Filter --user-data-dir khỏi args
4. Tạo custom launcher: gọi pwLauncher.launchPersistentContext()
5. _launch(false, ...) -- spawn worker.exe qua custom launcher
6. configure() -- bindHooks + onClose + resize page đầu tiên
7. Return BrowserContext
```

## Lưu ý

- `launch()` không hỗ trợ đầy đủ -- nó in warning và fallback sang `launchPersistentContext`.
- `--disable-extensions` tự động bị loại khỏi args vì engine cần extensions.
- Tất cả instance chia sẻ cùng `serviceKey` (module-level).

---
