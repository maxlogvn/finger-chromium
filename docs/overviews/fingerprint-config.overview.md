# Overview: Cấu hình Fingerprint

## Tóm tắt

Đã triển khai `FingerprintOptions` type (9 fields), `useFingerprint()` method (Fluent API), `validateConfig()` cho data/options. Luồng: user config -> lưu vào `this.fingerprint` -> gửi lên engine native qua `api('setup')` khi launch.

## Kiến trúc

```
types/fingerprint.ts                -> FingerprintOptions interface (9 fields)
plugin/index.ts (useFingerprint)    -> validateConfig -> this.fingerprint = { value, options }
plugin/index.ts (_launch)           -> api('setup', { fingerprint: this.fingerprint })
engine native (C/C++)               -> inject fingerprint ở tầng native
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `FingerprintOptions` interface | `src/types/fingerprint.ts` | 18-91 |
| `useFingerprint()` (FingerprintPlugin) | `src/plugin/index.ts` | 115-119 |
| `validateConfig()` | `src/plugin/utils.ts` | 5-15 |
| `useFingerprint()` (BrowserEngine) | `src/adapter/playwright/chromium.ts` | 101-105 |
| Gửi config lên engine | `src/plugin/index.ts` | 239-249 |

## 9 fields trong FingerprintOptions

| Field | Default | Engine xử lý |
|---|---|---|
| `usePerfectCanvas` | `true` | Inject canvas data thật từ fingerprint |
| `safeWebGL` | `true` | Override WebGLRenderingContext (GPU vendor, renderer) |
| `safeAudio` | `true` | Override AudioContext methods (sample rate, channels) |
| `safeCanvas` | `true` | Thêm noise vào Canvas2D |
| `safeBattery` | `true` | Override Navigator.getBattery() |
| `safeElementSize` | `false` | Override Element.getClientRects() / getBoundingClientRect() |
| `emulateSensorAPI` | `true` | Override Sensor constructor |
| `emulateDeviceScaleFactor` | `true` | Set devicePixelRatio |
| `useFontPack` | `true` | Inject font list matching fingerprint |

## Quyết định thiết kế

- **`safeElementSize` mặc định false**: Chặn `getClientRects()` ảnh hưởng layout web app. User cần chủ động bật nếu cần che giấu element size.
- **Các field còn lại mặc định true**: Fingerprint check kiểm tra đồng thời nhiều kỹ thuật. Tắt bất kỳ field nào làm tăng khả năng bị detect.
- **`validateConfig()` dùng `Error` thay `PluginError`**: Lỗi đầu vào đơn giản, không liên quan engine. `PluginError` dành cho lỗi runtime engine.
- **Fingerprint inject ở tầng C/C++**: Engine native inject trước khi Chromium khởi động -- không có dấu hiệu bị override trong JavaScript context.

## Flow data

```
BrowserEngine.useFingerprint(data, opts)
  -> plugin.useFingerprint(data, opts)
    -> validateConfig('fingerprint', data, opts)
    -> this.fingerprint = { value: data, options: opts }

launch()
  -> engine._launch()
    -> api('setup', { fingerprint: this.fingerprint })
      -> IPC -> engine native
        -> C/C++ inject WebGL, Audio, Canvas, Battery, Sensor, ...
```

## Lưu ý

- `usePerfectCanvas` yêu cầu fingerprint data chứa dữ liệu PerfectCanvas.
- `useFontPack` cần cài FontPack riêng (wiki bablosoft).
- Fingerprint data gửi qua `api('setup')` -- không có API update sau launch.
- Engine inject ở tầng native -- không thể can thiệp ở JS layer.

## Tài liệu liên quan

- `docs/designs/fingerprint-config.design.md`
- `docs/specs/fingerprint-config.spec.md`
- `docs/plans/fingerprint-config.plan.md`
- `docs/products/fingerprint-config.product.md`
- `src/types/fingerprint.ts`
- `src/plugin/index.ts`
