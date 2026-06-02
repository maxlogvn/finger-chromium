# Product: Playwright Bridge

## Tổng quan

Bridge cho phép dùng `PlaywrightFingerprintPlugin` với API `launchPersistentContext()` thay vì spawn worker.exe trực tiếp. Cho phép tận dụng Playwright API quen thuộc.

## Cách dùng

```ts
const plugin = new PlaywrightFingerprintPlugin();
const context = await plugin.launchPersistentContext('', {
  key: process.env.BABLOSOFT_KEY,
  args: ['--disable-web-security'],
});

const page = await context.newPage();
// page tự động được resize theo fingerprint
```

## Lưu ý

- `proxy`, `channel`, `firefoxUserPrefs` không được hỗ trợ -- sẽ throw error
- `--disable-extensions` bị loại khỏi args -- không tương thích với fingerprint engine
- Luôn dùng `launchPersistentContext` thay vì `launch` để đảm bảo profile được quản lý
