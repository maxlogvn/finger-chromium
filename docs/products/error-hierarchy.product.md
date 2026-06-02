# Product: Hệ thống lỗi

## Tổng quan

Tất cả lỗi từ engine binary, network, config đều được chuẩn hoá thành `PluginError` hierarchy. Dễ bắt và xử lý.

## Các loại lỗi

```ts
PluginError           // Base -- tất cả lỗi engine
├── MissingKeyError   // Thiếu key bảo mật
├── InvalidEngineError // Engine chưa tải
├── EngineTimeoutError // Timeout khởi động
└── RequestTimeoutError // Timeout request
```

## Khi nào gặp lỗi nào?

| Lỗi | Nguyên nhân | Cách fix |
|---|---|---|
| `MissingKeyError` | `BABLOSOFT_KEY` không set hoặc sai | Set key qua env hoặc `usePrivateKey()` |
| `InvalidEngineError` | Engine binary không tìm thấy hoặc không chạy được | Kiểm tra `ENGINE_WORKING_DIR`, network |
| `EngineTimeoutError` | Download/extract/spawn quá lâu | Tăng `FINGERPRINT_TIMEOUT` |
| `RequestTimeoutError` | IPC request không có phản hồi | Kiểm tra engine process, tăng timeout |

## Cách bắt lỗi

```ts
import { Chromium } from 'fingerprint-chromium-engine';
import { MissingKeyError, EngineTimeoutError } from 'fingerprint-chromium-engine';

try {
  await Chromium.launch();
} catch (err) {
  if (err instanceof MissingKeyError) {
    console.error('Ban can cung cap BABLOSOFT_KEY hop le');
    process.exit(1);
  }
  if (err instanceof EngineTimeoutError) {
    console.error('Engine khoi dong qua lau, thu tang FINGERPRINT_TIMEOUT');
  }
  if (err instanceof PluginError) {
    console.error('Loi fingerprint engine:', err.message);
  }
}
```

## Chi tiết kỹ thuật

- `PluginError` tự set `this.name = constructor.name` -- instanceof vẫn hoạt động sau minify
- `Error.captureStackTrace` cho stack trace sạch
- Message dùng `dedent` -- tiếng Việt pha tiếng Anh
- `MissingKeyError` message nhấn mạnh key cần cho apply, không chỉ fetch
