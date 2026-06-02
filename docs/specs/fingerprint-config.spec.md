# Spec: Cấu hình Fingerprint

## File: `src/types/fingerprint.ts` (91 dòng)

### Options chi tiết

```ts
interface FingerprintOptions {
  usePerfectCanvas?: boolean;           // default: true
  safeWebGL?: boolean;                  // default: true
  safeAudio?: boolean;                  // default: true
  safeCanvas?: boolean;                 // default: true
  safeBattery?: boolean;                // default: true
  safeElementSize?: boolean;            // default: false
  emulateDeviceScaleFactor?: boolean;   // default: true
  emulateSensorAPI?: boolean;           // default: true
  useFontPack?: boolean;                // default: true
}
```

### Từng option

| Option | Type | Default | Mô tả JSDoc từ code |
|---|---|---|---|
| `emulateDeviceScaleFactor` | `boolean` | `true` | Giả lập màn hình HiDPI/Retina. `devicePixelRatio` luôn được thay thế đúng. |
| `emulateSensorAPI` | `boolean` | `true` | Giả lập Sensor API (gia tốc kế, con quay hồi chuyển). Nên bật cho fingerprint di động. |
| `usePerfectCanvas` | `boolean` | `true` | Canvas rendering chính xác theo fingerprint. Yêu cầu fingerprint có PerfectCanvas data. |
| `useFontPack` | `boolean` | `true` | Dùng FontPack (nếu đã cài) để đồng bộ font. Tải tại: https://wiki.bablosoft.com/doku.php?id=fontpack |
| `safeElementSize` | `boolean` | `false` | Che giấu tọa độ DOM element, chống ClientRects fingerprinting. |
| `safeBattery` | `boolean` | `true` | Giả lập Battery API. Nếu thiết bị gốc không có Battery API, luôn trả về 100%. |
| `safeCanvas` | `boolean` | `true` | Nhiễu Canvas 2D, chống canvas fingerprinting. |
| `safeAudio` | `boolean` | `true` | Nhiễu Web Audio API, che sample rate và số kênh âm thanh. |
| `safeWebGL` | `boolean` | `true` | Nhiễu WebGL, che GPU vendor và renderer. |

### PluginConfig

```ts
interface PluginConfig {
  value: string;     // JSON fingerprint string
  options: object;   // FingerprintOptions
}
```

### Validation

Trong `src/plugin/utils.ts`:

```ts
validateConfig('fingerprint', value, options);
```

- `value` phải là string (JSON fingerprint).
- `options` phải là object, không null.
- Nếu không hợp lệ -> throw `Error('Tham số không hợp lệ cho cấu hình "fingerprint".')`.

### Integration trong _launch()

```ts
const setupParams = {
  key: serviceKey,
  pid: uuid,
  fingerprint: this.fingerprint,  // { value, options }
  // ...
};
const response = await api('setup', setupParams);
```

Engine binary chịu trách nhiệm parse và áp dụng từng option.

---

## Kiểm tra

- Fingerprint JSON không hợp lệ -> lỗi từ engine response, không validate ở JS layer.
- `fetch()` không có key hợp lệ -> engine trả lỗi -> throw MissingKeyError.
- `safeElementSize` mặc định tắt vì ảnh hưởng layout.

---
