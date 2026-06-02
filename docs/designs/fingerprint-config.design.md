# Design: Cấu hình Fingerprint

## Vấn đề

Trình duyệt cần giả lập thiết bị thật để tránh bot detection. Fingerprint chứa thông tin GPU, màn hình, font, canvas...

## Giải pháp

`useFingerprint(data, options)` với các option:
- **PerfectCanvas**: render canvas chính xác theo fingerprint
- **WebGL noise**: che giấu GPU thật
- **Audio noise**: che giấu hardware audio
- **Canvas noise**: chống canvas fingerprinting
- **Battery API**: giả lập pin
- **Sensor API**: gia tốc kế, con quay hồi chuyển
- **HiDPI/Retina**: mật độ pixel cao
- **FontPack**: đồng bộ font
- **SafeElementSize**: che giấu ClientRects

---

Xem thêm: [Spec](../specs/fingerprint-config.spec.md) | [Plan](../plans/fingerprint-config.plan.md)
