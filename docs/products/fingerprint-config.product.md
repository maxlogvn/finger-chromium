# Product: Cấu hình Fingerprint

## Tổng quan

Tuỳ chọn fingerprint giúp trình duyệt giả lập thiết bị thật, tránh bot detection.

## Cách dùng

```ts
Chromium.useFingerprint(fingerprintData, {
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

## Giải thích options

- **PerfectCanvas**: thay thế dữ liệu Canvas bằng dữ liệu từ fingerprint thật
- **safeWebGL**: thêm nhiễu vào WebGL, che GPU thật
- **safeAudio**: thêm nhiễu vào Web Audio API
- **safeCanvas**: thêm nhiễu vào Canvas 2D
- **safeBattery**: giả lập Battery API, mỗi phiên giá trị khác nhau
- **FontPack**: đồng bộ font chữ với fingerprint mục tiêu
