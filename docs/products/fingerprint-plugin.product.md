# Product: FingerprintPlugin

## Tổng quan

FingerprintPlugin là class trung tâm -- tất cả cấu hình và vòng đời đều đi qua class này.

## Luồng lifecycle

```
useFingerprint() → useProxy() → useProfile() → setServiceKey()
       ↓
    spawn() / _launch()
       ↓
  API 'setup' → cleaner.watch() → mutex.create()
       ↓
  worker.exe spawn → configure() → synchronize()
```

## Fluent API

```ts
const plugin = new FingerprintPlugin();
plugin
  .useFingerprint(data, { usePerfectCanvas: true })
  .useProxy('http://user:pass@host:port')
  .useProfile('./profile')
  .setServiceKey('your-key');

const browser = await plugin.spawn();
```
