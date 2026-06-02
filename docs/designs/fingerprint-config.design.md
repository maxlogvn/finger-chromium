# Design: Cấu hình Fingerprint

## Vấn đề

Trình duyệt cần giả lập thiết bị thật để tránh bot detection. Fingerprint chứa thông tin GPU (WebGL), màn hình (canvas), audio, font, pin, cảm biến.

## Giải pháp

Fingerprint được inject ở cấp độ C/C++ thông qua engine binary chứ không phải JavaScript override. Điều này giúp không để lại dấu vết trong JS context.

### 9 options

| Option | Mục đích | Ghi chú |
|---|---|---|
| `usePerfectCanvas` | Canvas rendering chính xác theo fingerprint thật | Data từ fingerprint string |
| `safeWebGL` | WebGL noise -- che GPU thật | Thêm nhiễu vào WebGL rendering |
| `safeAudio` | Audio noise -- che hardware audio | Web Audio API |
| `safeCanvas` | Canvas noise -- chống canvas fingerprinting | 2D canvas |
| `safeBattery` | Battery API -- giả lập pin | Mỗi phiên giá trị khác nhau |
| `safeElementSize` | Che giấu DOM element coordinates | Mặc định false vì có thể ảnh hưởng layout |
| `emulateDeviceScaleFactor` | HiDPI/Retina -- mật độ pixel | Dựa trên fingerprint |
| `emulateSensorAPI` | Sensor API -- gia tốc kế, con quay hồi chuyển | Dữ liệu từ fingerprint |
| `useFontPack` | Đồng bộ font chữ | Font từ fingerprint target |

### Luồng xử lý

1. User set fingerprint: `useFingerprint(jsonString, options)`
2. Lưu vào `PluginConfig { value: jsonString, options: FingerprintOptions }`
3. Khi `_launch()`, gọi `api('setup', { fingerprint: config, ... })`
4. Engine binary nhận config, inject vào browser process ở C level

---

Xem thêm: [Spec](../specs/fingerprint-config.spec.md) | [Plan](../plans/fingerprint-config.plan.md)
