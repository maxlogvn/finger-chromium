# Hướng dẫn cấu hình Fingerprint

Tài liệu này mô tả chi tiết cách lấy và cấu hình fingerprint cho trình duyệt. Fingerprint là yếu tố quan trọng nhất trong việc chống bot detection -- một fingerprint tốt khiến trình duyệt của bạn trông giống hệt thiết bị người dùng thật.

## Tổng quan

Fingerprint được inject ở tầng C/C++ trước khi trình duyệt khởi động, không để lại dấu vết override ở JavaScript layer. Điều này có nghĩa các website chống bot không thể phát hiện rằng bạn đang giả lập fingerprint.

Quy trình sử dụng fingerprint gồm 2 bước:
1. **Lấy fingerprint**: Gọi `newFingerprint()` để lấy fingerprint từ service của bablosoft.
2. **Gắn fingerprint**: Gọi `.useFingerprint()` để gắn fingerprint vào engine trước khi launch.

---

## FetchOptions -- Tùy chọn lấy fingerprint

`FetchOptions` kiểm soát cách lọc fingerprint từ service. Sử dụng khi gọi `BrowserEngine.newFingerprint(options)`.

### Lọc theo thiết bị và hệ điều hành (`tags`)

Tag cho phép lọc fingerprint theo thiết bị, hệ điều hành hoặc trình duyệt cụ thể. Bạn có thể kết hợp nhiều tag để thu hẹp kết quả.

```ts
const fp = await BrowserEngine.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
});
```

#### Danh sách tag đầy đủ

| Nhóm              | Tag                      | Mô tả                          |
| ----------------- | ------------------------ | ------------------------------ |
| Loại thiết bị     | `'Desktop'`              | Máy tính để bàn                 |
|                   | `'Mobile'`               | Thiết bị di động                |
| Hệ điều hành      | `'Microsoft Windows'`    | Windows                         |
|                   | `'Apple Mac'`            | macOS                           |
|                   | `'Android'`              | Android                         |
|                   | `'Linux'`                | Linux                           |
|                   | `'iPad'`                 | iPad                            |
|                   | `'iPhone'`               | iPhone                          |
| Trình duyệt       | `'Chrome'`               | Google Chrome                   |
|                   | `'Edge'`                 | Microsoft Edge                  |
|                   | `'Safari'`               | Apple Safari                    |
|                   | `'Firefox'`              | Mozilla Firefox                 |
|                   | `'YaBrowser'`            | Yandex Browser                  |
| Phiên bản Windows | `'Windows 7'`            | Windows 7                       |
|                   | `'Windows 8'`            | Windows 8                       |
|                   | `'Windows 10'`           | Windows 10                      |
| Không lọc         | `'*'`                    | Lấy fingerprint bất kỳ          |

### Lọc theo thời gian thu thập (`timeLimit`)

Giới hạn fingerprint chỉ lấy từ những thiết bị đã thu thập trong một khoảng thời gian nhất định. Fingerprint càng cũ càng có nguy cơ bị phát hiện vì phiên bản trình duyệt lỗi thời.

```ts
const fp = await BrowserEngine.newFingerprint({
  timeLimit: '30 days',
});
```

| Giá trị       | Mô tả                               |
| ------------- | ----------------------------------- |
| `'*'`         | Không giới hạn thời gian            |
| `'15 days'`   | Chỉ lấy fingerprint trong 15 ngày   |
| `'30 days'`   | Chỉ lấy fingerprint trong 30 ngày   |
| `'60 days'`   | Chỉ lấy fingerprint trong 60 ngày   |

### Lọc theo độ phân giải màn hình

```ts
const fp = await BrowserEngine.newFingerprint({
  minWidth: 1280,
  maxWidth: 1920,
  minHeight: 720,
  maxHeight: 1080,
});
```

| Thuộc tính   | Kiểu      | Mô tả                              |
| ------------ | --------- | ---------------------------------- |
| `minWidth`   | `number`  | Chiều rộng màn hình tối thiểu (px) |
| `maxWidth`   | `number`  | Chiều rộng màn hình tối đa (px)    |
| `minHeight`  | `number`  | Chiều cao màn hình tối thiểu (px)  |
| `maxHeight`  | `number`  | Chiều cao màn hình tối đa (px)     |

### Lọc theo phiên bản trình duyệt

```ts
const fp = await BrowserEngine.newFingerprint({
  tags: ['Chrome'],
  minBrowserVersion: 'current',
  maxBrowserVersion: 'current',
});
```

| Thuộc tính           | Kiểu                   | Mô tả                                                                    |
| -------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `minBrowserVersion`  | `number \| 'current'`  | Phiên bản tối thiểu. `'current'` = phiên bản Chromium đang cài trên máy  |
| `maxBrowserVersion`  | `number \| 'current'`  | Phiên bản tối đa. Đặt bằng `minBrowserVersion` để lọc đúng một phiên bản |

**Khuyến nghị**: Luôn dùng `'current'` cho cả hai để đảm bảo phiên bản fingerprint khớp với phiên bản Chromium cài trên máy, giảm nguy cơ bị phát hiện.

### PerfectCanvas

PerfectCanvas là tính năng render canvas chính xác theo fingerprint thật, giúp vượt qua các bài kiểm tra canvas fingerprinting nâng cao (như của Cloudflare).

```ts
const fp = await BrowserEngine.newFingerprint({
  perfectCanvasRequest: 'your-canvas-request-data',
  perfectCanvasLogs: true,
  dynamicPerfectCanvas: true,
  enablePrecomputedFingerprints: true,
});
```

| Thuộc tính                      | Kiểu       | Mặc định | Mô tả                                                                             |
| ------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------- |
| `perfectCanvasRequest`          | `string`   | (tuỳ chọn)| Dữ liệu PerfectCanvas request từ CanvasInspector. Lấy một lần cho mỗi site        |
| `perfectCanvasLogs`             | `boolean`  | `false`  | Bật logging khi fingerprint có dữ liệu PerfectCanvas                               |
| `dynamicPerfectCanvas`          | `boolean`  | `true`   | Cho phép render PerfectCanvas động từ các máy đang kết nối. Tắt để tiết kiệm thời gian |
| `enablePrecomputedFingerprints` | `boolean`  | `true`   | Truy vấn database tĩnh trước khi dùng dynamic rendering. Tắt để render động ngay    |
| `enableCustomServer`            | `boolean`  | `false`  | Chỉ lấy fingerprint từ custom server (yêu cầu tài khoản hỗ trợ tính năng này)       |

**Lưu ý về PerfectCanvas**:
- `perfectCanvasRequest` chỉ cần lấy một lần cho mỗi website mục tiêu, không cần lấy lại cho mỗi fingerprint.
- Nếu không truyền `perfectCanvasRequest`, các tuỳ chọn `dynamicPerfectCanvas` và `enablePrecomputedFingerprints` sẽ không có hiệu lực.
- `enableCustomServer` tương thích với PerfectCanvas và ưu tiên hơn database tĩnh.

---

## FingerprintOptions -- Tùy chọn giả lập fingerprint

`FingerprintOptions` kiểm soát các kỹ thuật giả lập fingerprint trên trình duyệt khi đã có dữ liệu. Sử dụng với `.useFingerprint(data, options)`.

```ts
engine.useFingerprint(fingerprintData, {
  emulateDeviceScaleFactor: true,
  emulateSensorAPI: true,
  usePerfectCanvas: true,
  useFontPack: true,
  safeElementSize: false,
  safeBattery: true,
  safeCanvas: true,
  safeAudio: true,
  safeWebGL: true,
});
```

### Giả lập phần cứng

| Thuộc tính                   | Kiểu      | Mặc định | Mô tả                                                                         |
| ---------------------------- | --------- | -------- | ----------------------------------------------------------------------------- |
| `emulateDeviceScaleFactor`   | `boolean` | `true`   | Giả lập màn hình HiDPI/Retina. Render ở độ phân giải cao hơn, tốn tài nguyên hơn |
| `emulateSensorAPI`           | `boolean` | `true`   | Giả lập Sensor API (gia tốc kế, con quay hồi chuyển). Nên bật cho thiết bị di động |

### PerfectCanvas

| Thuộc tính       | Kiểu      | Mặc định | Mô tả                                                                    |
| ---------------- | --------- | -------- | ------------------------------------------------------------------------ |
| `usePerfectCanvas`| `boolean` | `true`   | Thay thế dữ liệu Canvas chính xác theo fingerprint. Yêu cầu fingerprint có dữ liệu PerfectCanvas |

### Font

| Thuộc tính    | Kiểu      | Mặc định | Mô tả                                                                                               |
| ------------- | --------- | -------- | --------------------------------------------------------------------------------------------------- |
| `useFontPack` | `boolean` | `true`   | Dùng FontPack để đồng bộ font với fingerprint. Tránh sai lệch nếu fingerprint có nhiều font hơn máy |

Tải FontPack tại: `https://wiki.bablosoft.com/doku.php?id=fontpack`

### Nhiễu dữ liệu (Anti-fingerprinting)

| Thuộc tính         | Kiểu      | Mặc định | Mô tả                                                                             |
| ------------------ | --------- | -------- | --------------------------------------------------------------------------------- |
| `safeElementSize`  | `boolean` | `false`  | Che giấu tọa độ thực của DOM element, chống ClientRects fingerprinting             |
| `safeBattery`      | `boolean` | `true`   | Giả lập Battery API, trả về giá trị khác nhau mỗi phiên. Nếu máy không hỗ trợ: 100% |
| `safeCanvas`       | `boolean` | `true`   | Thêm nhiễu vào Canvas 2D để chống canvas fingerprinting                             |
| `safeAudio`        | `boolean` | `true`   | Thêm nhiễu vào Web Audio API, che giấu sample rate và số kênh âm thanh              |
| `safeWebGL`        | `boolean` | `true`   | Thêm nhiễu vào WebGL, che giấu tên nhà sản xuất và renderer của GPU                |

---

## Ví dụ nâng cao

### Lấy fingerprint với PerfectCanvas

```ts
const fp = await BrowserEngine.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
  minBrowserVersion: 'current',
  maxBrowserVersion: 'current',
  timeLimit: '15 days',
  minWidth: 1920,
  minHeight: 1080,
  perfectCanvasRequest: 'your-canvas-request-data',
  perfectCanvasLogs: true,
  dynamicPerfectCanvas: true,
});
```

### Gắn fingerprint với tất cả tính năng bảo vệ

```ts
engine.useFingerprint(fp, {
  emulateDeviceScaleFactor: true,
  emulateSensorAPI: true,
  usePerfectCanvas: true,
  useFontPack: true,
  safeBattery: true,
  safeCanvas: true,
  safeAudio: true,
  safeWebGL: true,
});
```

### Lấy fingerprint cho thiết bị di động

```ts
const fp = await BrowserEngine.newFingerprint({
  tags: ['Chrome', 'Mobile', 'Android'],
  timeLimit: '30 days',
});

engine.useFingerprint(fp, {
  emulateSensorAPI: true,
  safeBattery: true,
});
```

### Tắt một số nhiễu để tăng hiệu năng

```ts
engine.useFingerprint(fp, {
  emulateDeviceScaleFactor: false,
  safeCanvas: false,
  safeAudio: false,
  safeWebGL: false,
});
```

---

## Lưu ý quan trọng

- **Dùng `'current'` cho phiên bản trình duyệt**: Luôn lọc fingerprint với `minBrowserVersion: 'current'` và `maxBrowserVersion: 'current'` để tránh sai lệch phiên bản.
- **Fingerprint cũ có rủi ro**: Trình duyệt lỗi thời dễ bị các website phát hiện và chặn. Nên dùng `timeLimit` để lọc fingerprint mới.
- **FontPack cải thiện độ chính xác**: Nếu fingerprint mục tiêu có nhiều font hơn hệ thống của bạn, hãy cài FontPack để tránh sai lệch.
- **PerfectCanvas cần dữ liệu**: `usePerfectCanvas` chỉ hoạt động nếu fingerprint chứa dữ liệu PerfectCanvas (lấy qua `perfectCanvasRequest`).
- **Nhiễu làm giảm hiệu năng**: Các tuỳ chọn `safeCanvas`, `safeAudio`, `safeWebGL` thêm overhead tính toán. Chỉ bật những gì cần thiết.
- **Inject ở tầng C/C++**: Fingerprint được inject trước khi JavaScript chạy, không thể bị phát hiện qua `navigator` hay các API JS khác.
