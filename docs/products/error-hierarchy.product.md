# Product: Hệ thống lỗi (Error Hierarchy)

## Tổng quan

Thay vì throw `Error` thông thường, thư viện dùng các class lỗi riêng, kế thừa từ `PluginError`. Điều này giúp bạn dễ dàng phân loại lỗi và xử lý khác nhau cho từng trường hợp.

## Cách dùng

### Bắt lỗi với `instanceof`

```ts
import { Chromium } from 'fingerprint-chromium-engine';

try {
  await Chromium.launch();
} catch (err) {
  if (err instanceof Chromium.engine.MissingKeyError) {
    // Chưa set key bảo mật
    console.error('Vui lòng tạo tài khoản và set BABLOSOFT_KEY.');
  } else if (err instanceof Chromium.engine.EngineTimeoutError) {
    // Tải engine quá lâu
    console.error('Tăng timeout hoặc kiểm tra mạng.');
  } else {
    console.error('Lỗi không xác định:', err);
  }
}
```

**Lưu ý:** Cách import chính xác hơn:

```ts
import { PluginError, MissingKeyError } from 'fingerprint-chromium-engine';
```

### Các loại lỗi

| Class | Khi nào xảy ra | Cách khắc phục |
|---|---|---|
| `PluginError` | Lỗi chung không thuộc loại nào | Kiểm tra message |
| `MissingKeyError` | Chưa set BABLOSOFT_KEY | Set key qua `usePrivateKey()` hoặc biến môi trường |
| `InvalidEngineError` | Engine không chạy được | Xoá thư mục engine, chạy lại code để tải mới |
| `EngineTimeoutError` | Khởi động engine quá lâu | Tăng timeout bằng `setEngineTimeout(ms)` |
| `RequestTimeoutError` | Chờ phản hồi engine quá lâu | Tăng timeout bằng `setRequestTimeout(ms)` |

### Ví dụ xử lý chi tiết

```ts
import {
  Chromium,
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from 'fingerprint-chromium-engine';

async function startBrowser() {
  try {
    Chromium.useFingerprint(fingerprintData);
    await Chromium.launch();
    const context = await Chromium.newContext();
    return context;
  } catch (error) {
    if (error instanceof MissingKeyError) {
      // Lỗi cấu hình -- hướng dẫn người dùng
      throw new Error(
        'Thiếu key bảo mật. Đọc hướng dẫn tại: https://wiki.bablosoft.com'
      );
    }

    if (error instanceof InvalidEngineError) {
      // Engine lỗi -- thử tải lại
      console.warn('Engine lỗi, đang thử tải lại...');
      // Xoá thư mục engine và thử lại
      await cleanupEngine();
      return await startBrowser(); // retry
    }

    if (error instanceof EngineTimeoutError) {
      // Timeout -- có thể do mạng chậm
      throw new Error(
        'Tải engine quá lâu. Vui lòng kiểm tra kết nối mạng ' +
        'hoặc tăng timeout.'
      );
    }

    if (error instanceof RequestTimeoutError) {
      // Request timeout
      throw new Error(
        'Engine không phản hồi. Thử restart ứng dụng.'
      );
    }

    // Lỗi không xác định
    throw error;
  }
}
```

## Lifecycle

Các lỗi chỉ xảy ra trong các method lifecycle:
- `launch()`: có thể throw `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`.
- `newContext()`: có thể throw `PluginError` nếu engine chưa launch.
- `quit()`: có thể throw `PluginError` nếu không lưu được profile.

## Môi trường

Các error class không phụ thuộc vào môi trường -- hoạt động trên mọi Node.js >= 18.

## Lưu ý

- **Không bắt `Error` chung chung.** Dùng `instanceof PluginError` để chỉ bắt lỗi từ engine, để các lỗi khác (như `TypeError`, `ReferenceError`) không bị nuốt mất.
- **Message lỗi có hướng dẫn khắc phục.** Đọc kỹ message trước khi tìm kiếm Google -- có thể câu trả lời đã có sẵn trong message.
- **`Error.captureStackTrace`** được dùng để loại bỏ constructor khỏi stack trace, giúp stack trace sạch hơn. Nếu runtime không hỗ trợ (ví dụ: React Native), code sẽ bỏ qua bước này.

---
