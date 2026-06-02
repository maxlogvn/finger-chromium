# Product: Cấu hình Fingerprint

## Tổng quan

Fingerprint được inject ở cấp C/C++ (không phải JavaScript override) -- không để lại dấu vết cho bot detection. Bạn cung cấp JSON fingerprint (từ bablosoft service), engine binary sẽ inject vào browser process.

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
Chromium.useFingerprint(fp);
```

## Từng option chi tiết

### usePerfectCanvas (default: true)

Canvas rendering khớp chính xác với fingerprint thật. Nếu tắt, canvas có thể bị phát hiện là giả.

### safeWebGL / safeAudio / safeCanvas

Thêm nhiễu vào các API đồ hoạ và âm thanh để che dấu hardware thật:
- **WebGL**: che GPU, driver, renderer
- **Audio**: che sample rate, audio buffer
- **Canvas**: canvas fingerprinting

### safeBattery (default: true)

Mỗi session giá trị pin khác nhau. Tránh bị track theo battery pattern.

### safeElementSize (default: false)

Che giấu kích thước DOM element thật qua ClientRects. **Mặc định tắt** vì có thể ảnh hưởng layout website.

### emulateDeviceScaleFactor (default: true)

HiDPI/Retina emulation. Nếu fingerprint có `deviceScaleFactor: 2`, màn hình sẽ hoạt động như Retina.

### emulateSensorAPI (default: true)

Giả lập gia tốc kế, con quay hồi chuyển, cảm biến ánh sáng dựa trên fingerprint.

### useFontPack (default: true)

Đồng bộ danh sách font chữ với fingerprint target. FontPack thường ~5-10MB, chứa font hệ thống của thiết bị thật.

## Lưu ý

- **safeWebGL** và **usePerfectCanvas** có thể ảnh hưởng performance trên GPU yếu
- **safeElementSize** nên chỉ bật khi cần tránh detection từ các script đo kích thước element
- Fingerprint JSON không được validate ở JS layer -- lỗi format sẽ xuất hiện từ engine response
