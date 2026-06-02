# Product: Hệ thống kiểu

## Tổng quan

Type definitions cho tất cả options của fingerprint-chromium-engine.

## Interface chính

### PWChromium

9 methods: `repackChromium`, `useFingerprint`, `useProxy`, `useProfile`, `newFingerprint`, `launch`, `newContext`, `quit`.

### FingerprintOptions

```ts
interface FingerprintOptions {
  emulateDeviceScaleFactor?: boolean; // HiDPI/Retina
  emulateSensorAPI?: boolean;         // Cảm biến (gia tốc, con quay)
  usePerfectCanvas?: boolean;         // Canvas chính xác
  useFontPack?: boolean;              // Đồng bộ font
  safeElementSize?: boolean;          // Che ClientRects (mặc định false)
  safeBattery?: boolean;              // Nhiễu Battery API
  safeCanvas?: boolean;               // Nhiễu Canvas 2D
  safeAudio?: boolean;                // Nhiễu Web Audio
  safeWebGL?: boolean;                // Nhiễu WebGL
}
```

### FetchOptions

Dùng để lọc fingerprint từ service:

```ts
interface FetchOptions {
  tags?: Tag[];           // ['Desktop', 'Chrome', 'Windows 10']
  timeLimit?: Time;       // '30 days'
  minWidth?: number;
  maxWidth?: number;
  minBrowserVersion?: number | 'current';
  maxBrowserVersion?: number | 'current';
}
```
