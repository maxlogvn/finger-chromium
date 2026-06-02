# Product: Hệ thống lỗi

## Tổng quan

Hệ thống lỗi dùng PluginError hierarchy -- bắt và xử lý từng loại lỗi riêng.

## Cách dùng

```ts
import { PluginError, MissingKeyError } from 'fingerprint-chromium-engine';

try {
  await browser.launch();
} catch (err) {
  if (err instanceof MissingKeyError) {
    console.error('Cần set key: browser.usePrivateKey("...")');
  } else if (err instanceof PluginError) {
    console.error('Lỗi engine:', err.message);
  }
}
```

## Các loại lỗi

| Lỗi | Ý nghĩa | Cách khắc phục |
|---|---|---|
| `MissingKeyError` | Thiếu key | Gọi `setServiceKey()` |
| `InvalidEngineError` | Engine lỗi | Xoá thư mục engine, chạy lại |
| `EngineTimeoutError` | Timeout khởi động | Tăng timeout bằng `setEngineTimeout()` |
| `RequestTimeoutError` | Timeout request | Tăng timeout bằng `setRequestTimeout()` |
