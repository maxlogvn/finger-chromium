# Hướng dẫn bắt đầu

Tài liệu này hướng dẫn cài đặt và sử dụng cơ bản thư viện `fingerprint-chromium-engine` -- trình điều khiển Chromium chống bot detection dành cho Playwright.

## Yêu cầu hệ thống

| Yêu cầu             | Chi tiết                              |
| ------------------- | ------------------------------------- |
| **Node.js**         | >= 18.0.0                             |
| **playwright-core** | >= 1.60.0 (peer dependency)           |
| **Hệ điều hành**    | Windows 10/11 (32-bit hoặc 64-bit)    |

## Cài đặt

```bash
npm install github:maxlogvn/finger-chromium
npm install playwright-core
npx playwright install chromium
```

## Private key

Thư viện yêu cầu private key để kết nối tới service lấy fingerprint. Đặt key qua biến môi trường:

```bash
set BABLOSOFT_KEY=your-private-key-here
```

Hoặc khai báo trong file `.env`:

```
BABLOSOFT_KEY=your-private-key-here
```

## Sử dụng cơ bản

### 1. Lấy fingerprint từ service

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const fingerprint = await BrowserEngine.newFingerprint({
  tags: ['Chrome', 'Desktop', 'Windows 10'],
  timeLimit: '30 days',
  minWidth: 1280,
  minHeight: 720,
});
```

Phương thức `newFingerprint()` là static method -- không cần tạo instance `BrowserEngine` đầy đủ. Engine tạm được tự động dọn dẹp sau khi fetch xong.

### 2. Cấu hình và khởi động trình duyệt

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

async function main() {
  // Lấy fingerprint từ service
  const fingerprint = await BrowserEngine.newFingerprint({
    tags: ['Chrome', 'Desktop', 'Windows 10'],
    timeLimit: '30 days',
  });

  // Khởi tạo engine với cấu hình
  const engine = new BrowserEngine();

  const browser = engine
    .useFingerprint(fingerprint, {
      usePerfectCanvas: true,
      safeWebGL: true,
    })
    .useProxy('http://user:pass@proxy.example.com:8080', {
      changeTimezone: true,
      changeWebRTC: 'replace',
    })
    .useProfile('./profiles/user_01', {
      loadProxy: true,
      loadFingerprint: true,
    })
    .launch({ headless: false });

  const context = await browser.newContext();

  // Tạo page và thao tác
  const page = await context.newPage();
  await page.goto('https://example.com');
  console.log(await page.title());

  // Đóng và lưu profile
  await browser.close();
}

main();
```

### 3. Tải lại profile từ phiên trước

```ts
async function resumeSession() {
  const engine = new BrowserEngine();

  // Chỉ cần useProfile() -- fingerprint và proxy sẽ được load tự động
  const browser = engine
    .useProfile('./profiles/user_01', {
      loadFingerprint: true,
      loadProxy: true,
    })
    .launch({ headless: false });

  const context = await browser.newContext();

  const page = await context.newPage();
  await page.goto('https://example.com');

  await browser.close();
}
```

## Các bước tiếp theo

| Tài liệu                                | Nội dung                                     |
| --------------------------------------- | -------------------------------------------- |
| [fingerprint.md](fingerprint.md)        | Hướng dẫn chi tiết về cấu hình fingerprint   |
| [proxy.md](proxy.md)                    | Hướng dẫn chi tiết về cấu hình proxy         |
| [profile.md](profile.md)                | Hướng dẫn quản lý profile                    |
| [api.md](api.md)                        | Tham khảo API đầy đủ                         |
| [error-handling.md](error-handling.md)  | Hướng dẫn xử lý lỗi                          |
| [advanced.md](advanced.md)              | Hướng dẫn nâng cao                           |
| [faq.md](faq.md)                        | Câu hỏi thường gặp                           |

## Lưu ý quan trọng

- **Thứ tự không quan trọng**: Các method cấu hình (`useFingerprint`, `useProxy`, `useProfile`) có thể được gọi theo bất kỳ thứ tự nào trước `launch()`.
- **Chỉ launch một lần**: `launch()` chỉ được gọi một lần cho mỗi instance. Gọi lại sẽ ném lỗi `PluginError`.
- **Một context tại một thời điểm**: Mỗi instance chỉ giữ một context. Phải gọi `close()` trước khi tạo context mới.
- **Cần gọi close()**: Luôn gọi `engine.close()` để đóng trình duyệt và lưu profile. Nếu không gọi, profile có thể bị hỏng.
