# Product: Hệ thống lỗi

## Tổng quan

Error hierarchy chuẩn hoá tất cả lỗi từ engine, network và config.

## Các loại lỗi

| Lỗi | Khi nào xảy ra |
|---|---|
| `MissingKeyError` | Key bảo mật không hợp lệ hoặc thiếu |
| `InvalidEngineError` | Engine chưa được tải hoặc giải nén |
| `EngineTimeoutError` | Khởi động engine quá thời gian |
| `RequestTimeoutError` | Request fingerprint quá thời gian |

## Cách bắt lỗi

```ts
import { PluginError, MissingKeyError } from 'fingerprint-chromium-engine';

try {
  await Chromium.launch();
} catch (err) {
  if (err instanceof MissingKeyError) {
    console.error('Vui lòng cung cấp BABLOSOFT_KEY hợp lệ');
  } else if (err instanceof PluginError) {
    console.error('Lỗi engine:', err.message);
  }
}
```
