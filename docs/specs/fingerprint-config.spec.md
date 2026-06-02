# Spec: Fingerprint Config

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Tính năng fingerprint inject dữ liệu fingerprint thật vào browser Chromium thông qua engine C/C++. Dữ liệu là JSON string từ service (lấy qua `fetch()`), options kiểm soát kỹ thuật giả lập: PerfectCanvas, WebGL noise, Audio noise, Canvas noise, Battery API, Sensor API, HiDPI, FontPack, ElementSize.

Tất cả fingerprint được inject ở tầng C/C++ trước khi Chromium khởi động — không có dấu hiệu override trong JavaScript context.

Source types: `src/types/fingerprint.ts` (91 dòng). Source config: `src/plugin/index.ts`.

## Yêu cầu

- `useFingerprint(data, options)` — gắn fingerprint data + options.
- Validate: `data` phải là string, `options` phải là object không null.
- Khi validate thất bại, dùng `new Error()` (không phải `PluginError`) — vì lỗi đầu vào đơn giản, không liên quan engine.
- 9 field options với giá trị mặc định: `true` cho hầu hết, `safeElementSize` mặc định `false`.
- Fingerprint data được gửi lên engine qua API `setup` khi `_launch()`.

## Thiết kế

### Luồng dữ liệu

```
User gọi useFingerprint(jsonString, options)
  │
  └─ FingerprintPlugin.useFingerprint()
       │
       ├─ validateConfig('fingerprint', value, options)
       │    └─ Throw Error nếu value không phải string hoặc options không phải object
       │
       └─ this.fingerprint = { value, options }
            │
            └─ _launch() gửi lên engine qua api('setup', { fingerprint: { value, options } })
                 │
                 └─ Engine (C/C++) inject fingerprint vào browser process
```

Tham chiếu design doc: `docs/designs/fingerprint-config.design.md`.

## API / Data flow

```ts
plugin.useFingerprint(jsonData, {
  usePerfectCanvas: true,        // canvas chính xác (mạnh nhất)
  safeWebGL: true,               // nhiễu WebGL GPU
  safeAudio: true,               // nhiễu Web Audio API
  safeCanvas: true,              // nhiễu Canvas 2D
  safeBattery: true,             // giả lập Battery API
  emulateDeviceScaleFactor: true, // HiDPI/Retina
  emulateSensorAPI: true,        // Sensor API (di động)
  useFontPack: true,             // đồng bộ font
  safeElementSize: false,        // che giấu element coordinates (mặc định tắt)
});
```

### FingerprintOptions

| Field | Type | Default | Mô tả |
|---|---|---|---|
| `emulateDeviceScaleFactor` | `boolean` | `true` | Giả lập HiDPI/Retina theo fingerprint. `devicePixelRatio` luôn được thay thế. |
| `emulateSensorAPI` | `boolean` | `true` | Giả lập Sensor API. Nên bật khi giả lập fingerprint thiết bị di động. |
| `usePerfectCanvas` | `boolean` | `true` | Thay thế Canvas data bằng bản chính xác. Yêu cầu fingerprint có PerfectCanvas data. |
| `useFontPack` | `boolean` | `true` | Đồng bộ danh sách font với fingerprint. Cần FontPack đã cài trên hệ thống. |
| `safeElementSize` | `boolean` | `false` | Che giấu tọa độ DOM element — chống ClientRects fingerprinting. Kỹ thuật nặng, không cần thiết cho mọi use case. |
| `safeBattery` | `boolean` | `true` | Giả lập Battery API. Nếu thiết bị không có pin, luôn trả về 100%. |
| `safeCanvas` | `boolean` | `true` | Nhiễu Canvas 2D data. |
| `safeAudio` | `boolean` | `true` | Nhiễu Web Audio API — sample rate, số kênh. |
| `safeWebGL` | `boolean` | `true` | Nhiễu WebGL — GPU vendor, renderer. |

### Tại sao safeElementSize mặc định false?

Che giấu element size là kỹ thuật fingerprinting defense nặng — nó intercept `getBoundingClientRect()` và `offset*` properties. Hầu hết website không dùng ClientRects fingerprinting. Bật khi cần chống fingerprint detection mạnh.

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/types/fingerprint.ts` | `FingerprintOptions` interface | 91 |
| `src/plugin/index.ts` | `useFingerprint()` — validate + lưu config | 302 |
| `src/plugin/utils.ts` | `validateConfig()` — kiểm tra kiểu tham số | — |
| `src/plugin/config.ts` | `configure()` — resize viewport (liên quan gián tiếp) | 86 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `data` không phải string | Throw `Error` — lỗi validate đầu vào |
| `options` không phải object (kể cả null) | Throw `Error` — lỗi validate đầu vào |
| Không gọi `useFingerprint()` | Engine dùng fingerprint mặc định (không lỗi) |
| Gọi `useFingerprint()` sau `launch()` | Không throw, nhưng config không có hiệu lực |

## Kiểm tra

- Happy path: `useFingerprint(jsonString, options)` → lưu config → `launch()` → fingerprint inject thành công.
- Error: `data` là number → throw Error.
- Edge case: không gọi `useFingerprint` → engine vẫn launch với fingerprint mặc định.
- Edge case: `safeElementSize` mặc định `false` khi không truyền options.
