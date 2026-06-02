# Product: FingerprintPlugin

## Tổng quan

FingerprintPlugin là orchestrator trung tâm quản lý toàn bộ vòng đời fingerprint browser.

## Cách dùng

```ts
const plugin = new FingerprintPlugin();

plugin
  .useFingerprint('{...fingerprint JSON...}')
  .useProxy('http://user:pass@proxy:8080')
  .useProfile('C:/profiles/user_01');

const context = await plugin.launchPersistentContext('', {
  key: process.env.BABLOSOFT_KEY,
  viewport: null,
});
```

## Vòng đời

1. **Config**: set fingerprint, proxy, profile qua fluent API
2. **Setup**: gọi API engine để khởi tạo browser config
3. **Spawn**: launch worker.exe với các arg đặc biệt
4. **Configure**: resize viewport, sync .ini
5. **Cleanup**: dọn file tạm, release mutex
