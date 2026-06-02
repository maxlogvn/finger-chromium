# Product: Cấu hình Fingerprint

## Tổng quan

Fingerprint được inject ở cấp C/C++ -- không để lại vết override trong JavaScript. Chống bot detection hiệu quả hơn JS-based fingerprint.

## Cách dùng

```ts
Chromium.useFingerprint(fingerprintJson, {
  usePerfectCanvas: true,
  safeWebGL: true,
  safeAudio: true,
  safeCanvas: true,
  safeBattery: true,
  emulateDeviceScaleFactor: true,
  emulateSensorAPI: true,
  useFontPack: true,
});
```

## Chi tiết từng option

- **usePerfectCanvas**: Dùng dữ liệu canvas từ fingerprint thật, không phải tự sinh
- **safeWebGL**: Thêm nhiễu vào WebGL -- che GPU thật, tránh WebGL fingerprinting
- **safeBattery**: Mỗi phiên giá trị pin khác nhau -- tránh bị track theo battery pattern
- **safeElementSize** (mặc định false): Che giấu kích thước thật của DOM element -- có thể ảnh hưởng UX
