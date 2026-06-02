# Product: Playwright Bridge

## Tổng quan

PlaywrightFingerprintPlugin kết nối FingerprintPlugin với Playwright, cho phép tạo BrowserContext đã inject fingerprint.

## Cách dùng

```ts
const plugin = new PlaywrightFingerprintPlugin();
plugin.useFingerprint(data).useProxy('http://...');

const context = await plugin.launchPersistentContext('./profile', {
  headless: false,
});
```

## Lưu ý

- `launch()` không được hỗ trợ trực tiếp -- nội bộ dùng `launchPersistentContext`
- Options `proxy`, `channel`, `firefoxUserPrefs` không được hỗ trợ -- throw error nếu truyền vào
