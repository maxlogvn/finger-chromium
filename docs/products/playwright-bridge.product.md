# Product: Playwright Bridge

## Tổng quan

PlaywrightFingerprintPlugin kết nối FingerprintPlugin với Playwright API. Nó cho phép bạn dùng `launchPersistentContext()` quen thuộc thay vì spawn worker.exe trực tiếp.

## Cách dùng

```ts
const plugin = new PlaywrightFingerprintPlugin();

// Dùng API giống Playwright
const context = await plugin.launchPersistentContext('', {
  key: process.env.BABLOSOFT_KEY,
  args: ['--disable-web-security'],
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

Các option sau sẽ throw error nếu bạn truyền vào:

- **`proxy`**: Dùng `useProxy()` thay thế
- **`channel`**: Chỉ hỗ trợ Chromium mặc định
- **`firefoxUserPrefs`**: Chỉ hỗ trợ Chromium

## Viewport tự động

Mỗi page mới được tạo qua `context.newPage()` sẽ tự động resize theo fingerprint. `page.setViewportSize()` bị chặn (chỉ in warning), vì viewport đã bị fingerprint lock.

## Luồng xử lý chi tiết

```
1. launchPersistentContext('', options)
2. Validate options (proxy/channel/firefoxUserPrefs → throw)
3. Filter --user-data-dir khỏi args
4. Gọi _launch(false, ...) với custom launcher
5. Custom launcher gọi pwLauncher.launchPersistentContext()
6. Configure: bindHooks + onClose + resize page đầu tiên
7. Return BrowserContext
```
