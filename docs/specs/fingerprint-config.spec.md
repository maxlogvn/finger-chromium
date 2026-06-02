# Spec: Cấu hình Fingerprint

## Mô tả

Tuỳ chọn fingerprint khi gọi `useFingerprint(data, options)`.

## Options

| Option | Type | Default | Mô tả |
|---|---|---|---|
| `usePerfectCanvas` | boolean | true | Canvas chính xác |
| `safeWebGL` | boolean | true | WebGL noise |
| `safeAudio` | boolean | true | Audio noise |
| `safeCanvas` | boolean | true | Canvas noise |
| `safeBattery` | boolean | true | Battery API |
| `safeElementSize` | boolean | false | ClientRects |
| `emulateDeviceScaleFactor` | boolean | true | HiDPI |
| `emulateSensorAPI` | boolean | true | Sensor API |
| `useFontPack` | boolean | true | FontPack |

---

Xem thêm: [Design](../designs/fingerprint-config.design.md) | [Plan](../plans/fingerprint-config.plan.md)
