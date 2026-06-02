# Product: Cấu hình Fingerprint

## Tổng quan

Fingerprint được inject ở cấp C/C++ (không phải JavaScript override) -- không để lại dấu vết cho bot detection. Bạn cung cấp JSON fingerprint (từ bablosoft service) và `FingerprintOptions` để kiểm soát từng kỹ thuật giả lập.

## Cách dùng

```ts
// Cách 1: Dùng fingerprint có sẵn
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

// Cách 2: Fetch fingerprint từ service
const fp = await Chromium.newFingerprint({
  tags: ['Desktop', 'Chrome', 'Windows 10'],
  timeLimit: '15 days',
  minWidth: 1920,
  minHeight: 1080,
});
Chromium.useFingerprint(fp, { usePerfectCanvas: true });
```

## Từng Option Chi Tiết

### `usePerfectCanvas` (mặc định: `true`)
Canvas rendering khớp chính xác với fingerprint thật. Yêu cầu fingerprint có PerfectCanvas data.

### `safeWebGL` / `safeAudio` / `safeCanvas` (mặc định: `true`)
Thêm nhiễu vào các API đồ hoạ và âm thanh:
- **WebGL**: che GPU, driver, renderer
- **Audio**: che sample rate, audio buffer
- **Canvas**: canvas fingerprinting 2D

### `safeBattery` (mặc định: `true`)
Mỗi session giá trị pin khác nhau. Nếu thiết bị gốc không có Battery API, luôn trả về 100%.

### `safeElementSize` (mặc định: `false`)
Che giấu kích thước DOM element qua ClientRects. **Mặc định tắt** vì có thể ảnh hưởng layout website.

### `emulateDeviceScaleFactor` (mặc định: `true`)
HiDPI/Retina emulation. `devicePixelRatio` luôn được thay thế đúng dù bật hay tắt.

### `emulateSensorAPI` (mặc định: `true`)
Giả lập gia tốc kế, con quay hồi chuyển, cảm biến ánh sáng. Nên bật cho fingerprint di động.

### `useFontPack` (mặc định: `true`)
Đồng bộ danh sách font chữ với fingerprint target. FontPack thường ~5-10MB, tải tại https://wiki.bablosoft.com/doku.php?id=fontpack

## Lưu ý

- `safeWebGL` và `usePerfectCanvas` có thể ảnh hưởng performance trên GPU yếu.
- `safeElementSize` nên chỉ bật khi cần tránh detection từ script đo kích thước element.
- Fingerprint JSON không được validate ở JS layer -- lỗi format xuất hiện từ engine response.

---
