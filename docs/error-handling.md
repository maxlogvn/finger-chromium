# Hướng dẫn xử lý lỗi

Tài liệu này mô tả các lớp lỗi trong thư viện, cách bắt và xử lý từng loại lỗi một cách hiệu quả.

## Danh sách lỗi

Thư viện định nghĩa hệ thống lỗi phân cấp. Tất cả đều kế thừa từ `PluginError`.

```
PluginError
  MissingKeyError
  InvalidEngineError
  EngineTimeoutError
  RequestTimeoutError
```

---

## PluginError

Lớp lỗi cơ bản. Dùng cho hầu hết các tình huống lỗi không thuộc loại chuyên biệt nào.

```ts
import { PluginError } from 'fingerprint-chromium-engine';

try {
  await engine.launch();
  await engine.launch(); // Lần thứ hai
} catch (err) {
  if (err instanceof PluginError) {
    console.error('Lỗi engine:', err.message);
    // "[BrowserEngine] launch() chỉ được gọi một lần."
  }
}
```

### Các tình huống gây PluginError

| Tình huống                                                          | Thông báo lỗi                                                        |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Gọi `launch()` hai lần                                              | `[BrowserEngine] launch() chỉ được gọi một lần.`                     |
| Gọi `newContext()` trước `launch()`                                 | `[BrowserEngine] Phải gọi launch() trước khi tạo context.`           |
| Gọi `newContext()` khi context đã tồn tại                           | `[BrowserEngine] Context đã được tạo. Gọi close() trước khi tạo mới.`|
| Gọi `newContext()` đồng thời                                        | `[BrowserEngine] Đang tạo context, không được gọi đồng thời.`        |
| `close()` gặp lỗi trong quá trình dọn dẹp                           | `[BrowserEngine] close() failed:\n...`                               |

---

## MissingKeyError

Ném ra khi thiếu private key (`BABLOSOFT_KEY`). Đây là lỗi phổ biến nhất khi mới bắt đầu.

```ts
import { MissingKeyError } from 'fingerprint-chromium-engine';

try {
  await BrowserEngine.newFingerprint({ tags: ['Chrome'] });
} catch (err) {
  if (err instanceof MissingKeyError) {
    console.error('Thiếu BABLOSOFT_KEY.');
    console.error('Hãy đặt biến môi trường BABLOSOFT_KEY=your-key-here');
  }
}
```

### Nguyên nhân

- Chưa đặt biến môi trường `BABLOSOFT_KEY`.
- Biến môi trường bị sai tên (phải viết hoa chính xác `BABLOSOFT_KEY`).
- Key không hợp lệ hoặc đã hết hạn.

### Cách khắc phục

```bash
# PowerShell
$env:BABLOSOFT_KEY = "your-key-here"

# Command Prompt
set BABLOSOFT_KEY=your-key-here

# Hoặc tạo file .env trong thư mục dự án
echo BABLOSOFT_KEY=your-key-here > .env
```

---

## InvalidEngineError

Ném ra khi engine binary chưa được tải xuống hoặc giải nén đúng cách.

```ts
import { InvalidEngineError } from 'fingerprint-chromium-engine';

try {
  await engine.launch().newContext();
} catch (err) {
  if (err instanceof InvalidEngineError) {
    console.error('Engine bị hỏng hoặc chưa được tải.');
    console.error('Hướng dẫn: xoá thư mục .tmp/browser/engine và chạy lại.');
  }
}
```

### Nguyên nhân

- Engine chưa được tải xuống từ bablosoft server.
- Quá trình giải nén engine bị lỗi (thiếu dung lượng ổ đĩa, quyền truy cập...).
- File engine bị antivirus xoá hoặc chặn.
- Thư mục engine bị hỏng do crash trước đó.

### Cách khắc phục

```bash
# Xoá thư mục engine hiện tại
Remove-Item -Recurse -Force .tmp\browser\engine

# Chạy lại code -- engine sẽ tự tải lại
node your-script.js
```

---

## EngineTimeoutError

Ném ra khi quá trình tải engine vượt quá thời gian cho phép.

```ts
import { EngineTimeoutError } from 'fingerprint-chromium-engine';

try {
  await engine.launch().newContext();
} catch (err) {
  if (err instanceof EngineTimeoutError) {
    console.error('Tải engine quá thời gian cho phép.');
    console.error('Kiểm tra kết nối mạng hoặc tăng timeout.');
  }
}
```

### Nguyên nhân

- Kết nối mạng chậm hoặc không ổn định.
- Server bablosoft bị quá tải hoặc bảo trì.
- Firewall hoặc proxy chặn kết nối đến server.
- Engine có dung lượng lớn, cần thời gian tải lâu.

### Cách khắc phục

- Kiểm tra kết nối internet.
- Kiểm tra firewall/proxy không chặn kết nối.
- Tăng timeout bằng method `setEngineTimeout()`.
- Thử lại sau vài phút.

---

## RequestTimeoutError

Ném ra khi request đến engine hoặc service vượt quá thời gian cho phép.

```ts
import { RequestTimeoutError } from 'fingerprint-chromium-engine';

try {
  const fp = await BrowserEngine.newFingerprint({ tags: ['Chrome'] });
} catch (err) {
  if (err instanceof RequestTimeoutError) {
    console.error('Request fingerprint timeout.');
    console.error('Kiểm tra kết nối hoặc tăng timeout.');
  }
}
```

### Nguyên nhân

- Server bablosoft phản hồi chậm.
- Kết nối mạng không ổn định.
- Engine xử lý request quá lâu (ví dụ: PerfectCanvas render động).

### Cách khắc phục

- Tăng timeout bằng method `setRequestTimeout()`.
- Thử dùng `enablePrecomputedFingerprints: true` và `dynamicPerfectCanvas: false` để giảm thời gian xử lý.
- Kiểm tra kết nối mạng.

---

## Mẫu xử lý lỗi tổng quát

```ts
import {
  BrowserEngine,
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from 'fingerprint-chromium-engine';

async function runBrowser() {
  const engine = new BrowserEngine();

  try {
    // Lấy fingerprint
    const fp = await BrowserEngine.newFingerprint({
      tags: ['Chrome', 'Desktop', 'Windows 10'],
      timeLimit: '30 days',
    });

    // Cấu hình
    const context = await engine
      .useFingerprint(fp, {
        usePerfectCanvas: true,
        safeWebGL: true,
      })
      .useProxy('http://user:pass@proxy:8080', {
        changeTimezone: true,
        changeWebRTC: 'replace',
      })
      .useProfile('./profiles/user_01', {
        loadFingerprint: true,
        loadProxy: true,
      })
      .launch({ headless: false })
      .newContext();

    const page = await context.newPage();
    await page.goto('https://example.com');
    console.log(await page.title());

  } catch (err) {
    if (err instanceof MissingKeyError) {
      console.error('[KEY] Thiếu BABLOSOFT_KEY:', err.message);
    } else if (err instanceof InvalidEngineError) {
      console.error('[ENGINE] Engine bị hỏng:', err.message);
    } else if (err instanceof EngineTimeoutError) {
      console.error('[TIMEOUT] Tải engine timeout:', err.message);
    } else if (err instanceof RequestTimeoutError) {
      console.error('[TIMEOUT] Request timeout:', err.message);
    } else if (err instanceof PluginError) {
      console.error('[PLUGIN] Lỗi engine:', err.message);
    } else {
      console.error('[UNKNOWN] Lỗi không xác định:', err);
    }
  } finally {
    // Luôn đóng engine trong finally để đảm bảo cleanup
    try {
      await engine.close();
    } catch {
      // Bỏ qua lỗi khi close
    }
  }
}

runBrowser();
```

---

## Mẫu retry khi gặp lỗi

```ts
async function fetchWithRetry(maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await BrowserEngine.newFingerprint({
        tags: ['Chrome', 'Desktop', 'Windows 10'],
        timeLimit: '30 days',
      });
    } catch (err) {
      if (err instanceof RequestTimeoutError && i < maxRetries - 1) {
        console.warn(`[RETRY ${i + 1}/${maxRetries}] Request timeout, thử lại...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Đã hết số lần retry.');
}
```

---

## Lưu ý

- **Luôn dùng `finally`**: Đặt `await engine.close()` trong `finally` block để đảm bảo engine được cleanup ngay cả khi có lỗi.
- **Phân biệt loại lỗi**: Mỗi loại lỗi có cách khắc phục khác nhau. Dùng `instanceof` để xử lý riêng.
- **Retry hợp lý**: Với `RequestTimeoutError` và `EngineTimeoutError`, retry có thể giải quyết vấn đề. Nhưng với `MissingKeyError` và `InvalidEngineError`, retry sẽ không có ích -- cần sửa nguyên nhân gốc.
- **Log chi tiết**: `PluginError` và các lớp con đều có `err.message` chứa hướng dẫn khắc phục chi tiết. Luôn log message này khi gặp lỗi.
