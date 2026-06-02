# Overview: Cấu hình Fingerprint

## Mục tiêu

Định nghĩa `FingerprintOptions` interface với 9 boolean flags kiểm soát các kỹ thuật giả lập fingerprint, tích hợp vào `FingerprintPlugin.useFingerprint()`.

## Kết quả

- `src/types/fingerprint.ts`: 91 dòng, interface `FingerprintOptions` với 9 fields.
- Tích hợp vào `FingerprintPlugin` qua `useFingerprint(value, options)`.
- Validate bằng `validateConfig()` trong `utils.ts`.

## Kiểm tra

- `npm run lint` -- 0 errors.

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### 8 default true, 1 default false

Tất cả field đều default `true`, ngoại trừ `safeElementSize` default `false` -- vì nó can thiệp vào `Element.getBoundingClientRect()` và `Element.prototype.clientWidth/Height`, có thể gây lỗi hiển thị website.

### Fingerprint không validate ở JS layer

`validateConfig()` chỉ kiểm tra value là string và options là object. Engine binary (C++) chịu trách nhiệm parse fingerprint JSON và áp dụng các option. Nếu JSON sai format, lỗi xuất hiện từ engine response dưới dạng raw string.

### Fingerprint data JSON format

JSON string chứa: GPU model, WebGL vendor/renderer, canvas fingerprint hash, audio fingerprint, font list, screen resolution, deviceScaleFactor. Định dạng do bablosoft service quy định.

### `usePerfectCanvas` yêu cầu PerfectCanvas data trong fingerprint

Nếu fingerprint không có PerfectCanvas data, engine bỏ qua option này. Tương tự, `useFontPack` cần cài FontPack trước.

### `emulateDeviceScaleFactor` và `emulateSensorAPI`

Chỉ có tác dụng khi fingerprint tương ứng có dữ liệu cho các field này. `devicePixelRatio` luôn được thay thế đúng dù bật hay tắt option.

---
