# Spec: Cấu hình Fingerprint

## Options chi tiết

```ts
interface FingerprintOptions {
  usePerfectCanvas?: boolean;           // default: true
  safeWebGL?: boolean;                  // default: true
  safeAudio?: boolean;                  // default: true
  safeCanvas?: boolean;                 // default: true
  safeBattery?: boolean;               // default: true
  safeElementSize?: boolean;           // default: false
  emulateDeviceScaleFactor?: boolean;  // default: true
  emulateSensorAPI?: boolean;          // default: true
  useFontPack?: boolean;               // default: true
}
```

## PluginConfig

```ts
interface PluginConfig {
  value: string;     // JSON fingerprint string
  options: object;   // FingerprintOptions
}
```

## Validation (trong plugin/utils.ts)

`validateConfig(type, value, options)`:
- `value` phải là string (JSON fingerprint)
- `options` phải là object (không null)
- Nếu không hợp lệ → throw PluginError

## Integration trong _launch()

```ts
const setupParams = {
  key: serviceKey,
  pid: uuid,
  fingerprint: this.fingerprint,  // { value, options }
  // ...
};
const response = await api('setup', setupParams);
```

Không có validation riêng từng option -- engine binary chịu trách nhiệm parse và áp dụng.
