# Product: Cấu hình Fingerprint

## Mô tả

Tính năng fingerprint cho phép gắn fingerprint thật vào browser Chromium thông qua `useFingerprint(data, options)`. Data là JSON string từ service (lấy qua `fetch()` hoặc `newFingerprint()`), options kiểm soát từng kỹ thuật giả lập như WebGL noise, Canvas noise, PerfectCanvas, Battery API, Sensor API,...

Tất cả fingerprint được inject ở tầng C/C++ trước khi Chromium khởi động — không có dấu hiệu override trong JavaScript context.

## Cách sử dụng

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();

const fingerprintData = await engine.newFingerprint({
  tags: ['Microsoft Windows', 'Chrome'],
});

const context = await engine
  .useFingerprint(fingerprintData, {
    usePerfectCanvas: true,       // canvas chính xác (mạnh nhất)
    safeWebGL: true,              // nhiễu WebGL
    safeAudio: true,              // nhiễu Audio API
    safeCanvas: true,             // nhiễu Canvas 2D
    safeBattery: true,            // giả lập Battery API
    emulateDeviceScaleFactor: true, // HiDPI/Retina
    emulateSensorAPI: true,       // Sensor API (di động)
    useFontPack: true,            // đồng bộ font
    safeElementSize: false,       // che giấu element coordinates
  })
  .launch()
  .newContext();
```

## Hành vi chi tiết

- `data` phải là JSON string từ fingerprint service. Engine parse và inject ở native layer.
- Options được validate: `data` phải là string, `options` phải là object không null.
- `usePerfectCanvas`: thay thế toàn bộ Canvas data bằng bản chính xác từ fingerprint thật — kỹ thuật mạnh nhất nhưng cần fingerprint có PerfectCanvas data.
- `safeElementSize` mặc định `false`: che giấu tọa độ DOM element là kỹ thuật nặng, không cần thiết cho mọi use case. Chỉ bật khi cần chống ClientRects fingerprinting.
- `useFontPack`: engine đồng bộ danh sách font với fingerprint — tránh bị phát hiện qua `window.fonts` khác biệt.

## Giới hạn và điều kiện

- `useFontPack` cần FontPack đã cài trên hệ thống.
- `usePerfectCanvas` yêu cầu fingerprint chứa PerfectCanvas data.
- Nếu không gọi `useFingerprint`, engine vẫn launch với fingerprint mặc định.
- Không thể thay đổi options sau khi `launch()` đã gọi.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/fingerprint-config.spec.md`
- Design: `docs/designs/fingerprint-config.design.md`
- Source: `src/plugin/config.ts`
