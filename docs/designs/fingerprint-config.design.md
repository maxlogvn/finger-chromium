# Design: Cấu hình Fingerprint

## Vấn đề

Trình duyệt cần giả lập thiết bị thật để tránh bot detection. Fingerprint chứa thông tin GPU (WebGL), màn hình (canvas), âm thanh (audio), font chữ, pin, cảm biến. Những thông tin này cần được inject sao cho không để lại dấu vết trong JavaScript context.

## Giải pháp

Fingerprint được inject ở cấp độ C/C++ thông qua engine binary -- không phải JavaScript override. Người dùng cung cấp fingerprint JSON (từ bablosoft service) kèm `FingerprintOptions` để kiểm soát từng kỹ thuật giả lập.

### API

```ts
Chromium.useFingerprint(fingerprintJson, {
  usePerfectCanvas: true,
  safeWebGL: true,
  safeAudio: true,
  safeCanvas: true,
  safeBattery: true,
  safeElementSize: false,
  emulateDeviceScaleFactor: true,
  emulateSensorAPI: true,
  useFontPack: true,
});
```

### 9 Options (8 default true, 1 default false)

| Option | Default | Mục đích |
|---|---|---|
| `usePerfectCanvas` | `true` | Canvas rendering khớp chính xác fingerprint thật |
| `safeWebGL` | `true` | Nhiễu WebGL -- che GPU, driver, renderer |
| `safeAudio` | `true` | Nhiễu Audio -- che sample rate, audio buffer |
| `safeCanvas` | `true` | Nhiễu Canvas 2D -- chống canvas fingerprinting |
| `safeBattery` | `true` | Giả lập Battery API -- mỗi phiên giá trị khác nhau |
| `emulateDeviceScaleFactor` | `true` | HiDPI/Retina -- mật độ pixel theo fingerprint |
| `emulateSensorAPI` | `true` | Sensor API -- gia tốc kế, con quay hồi chuyển |
| `useFontPack` | `true` | Đồng bộ font chữ với fingerprint target |
| `safeElementSize` | `false` | Che giấu DOM element coordinates -- có thể ảnh hưởng layout |

### Luồng xử lý

1. User gọi `useFingerprint(fingerprintJson, options)`.
2. `FingerprintPlugin.useFingerprint()` lưu vào `this.fingerprint = { value: jsonString, options }`.
3. Khi `_launch()`, gửi `fingerprint` trong `api('setup', ...)`.
4. Engine binary nhận config, inject fingerprint vào browser process ở C level.

### Validation

`validateConfig('fingerprint', value, options)` kiểm tra value là string, options là object không null. Engine binary chịu trách nhiệm parse fingerprint JSON và áp dụng option.

---

Xem thêm: [Spec](../specs/fingerprint-config.spec.md) | [Plan](../plans/fingerprint-config.plan.md)
