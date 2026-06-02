# Product: Hạ tầng dự án (Project Infrastructure)

## Tổng quan

`fingerprint-chromium-engine` là thư viện Node.js giúp bạn điều khiển trình duyệt Chromium thông qua Playwright, nhưng có thêm khả năng inject fingerprint thật ở cấp độ C/C++ -- tức là fingerprint được áp dụng trước khi trình duyệt khởi chạy, không để lại dấu vết trong JavaScript.

Thư viện này chạy **chỉ trên Windows** (32-bit hoặc 64-bit), vì engine binary và native mutex đều là file .exe và .node dành riêng cho Windows.

## Yêu cầu hệ thống

| Yêu cầu | Phiên bản tối thiểu |
|---|---|
| **Node.js** | >= 18 |
| **Hệ điều hành** | Windows (win32) -- 32-bit hoặc 64-bit |
| **playwright-core** | >= 1.60.0 (bắt buộc) |

## Cài đặt

```bash
npm install maxlogvn/finger-chromium
```

Sau khi cài, npm tự động chạy `prepare` script để build thư viện ra thư mục `dist/`. Nếu build không tự động chạy (do `--ignore-scripts`), hãy chạy thủ công:

```bash
npm run build
```

Bạn cũng cần cài Playwright riêng, vì nó là peer dependency (không được bundle cùng thư viện):

```bash
# Nếu bạn muốn bản đầy đủ (có trình cài browser)
npm install playwright

# Hoặc chỉ core (nhẹ hơn)
npm install playwright-core
```

Sau đó cài Chromium cho Playwright:

```bash
npx playwright install chromium
```

## Cách dùng nhanh

```ts
import { Chromium } from 'fingerprint-chromium-engine';

// Bước 1: Cấu hình fingerprint
// (fingerprintData là JSON string lấy từ service)
Chromium.useFingerprint(fingerprintData, {
  usePerfectCanvas: true,
  safeWebGL: true,
});

// Bước 2: Launch trình duyệt
// headless: false là bắt buộc -- fingerprint check phát hiện headless mode
await Chromium.launch({ headless: false });

// Bước 3: Tạo context và page
const context = await Chromium.newContext();
const page = await context.newPage();
await page.goto('https://example.com');
console.log(await page.title());

// Bước 4: Dọn dẹp
await Chromium.quit();
```

## Các lệnh phát triển

```bash
# Build thư viện (ESM + CJS + DTS)
npm run build

# Chạy test (cần browser thật)
npm test

# Kiểm tra lỗi code
npm run lint

# Format code tự động
npm run format
```

## Lifecycle

| Method | Trước launch | Sau launch | Sau quit |
|---|---|---|---|
| `launch()` | OK (tối đa 1 lần) | Throw error | OK |
| `newContext()` | Throw error | OK (tối đa 1 lần) | Throw error |
| `quit()` | Không làm gì | OK | Không làm gì |
| `useFingerprint()` | OK | OK | OK |
| `useProxy()` | OK | OK | OK |
| `useProfile()` | OK | OK | OK |
| `repackChromium()` | OK | OK | OK |

## Cấu trúc thư mục

Thư mục source code được tổ chức thành 5 nhánh chính:

```
src/
├── index.ts         -- Điểm vào duy nhất, export Chromium + types
├── types/           -- Định nghĩa TypeScript (5 files)
├── common/          -- Script chạy trong trình duyệt
├── loader/          -- Tự động tìm playwright-core
└── plugin/          -- Logic điều khiển engine
    ├── adapter/playwright/  -- Cầu nối với Playwright
```

## Biến môi trường

| Biến | Mục đích | Giá trị mặc định |
|---|---|---|
| `BABLOSOFT_KEY` | Key bảo mật cho engine | `''` (rỗng) |
| `BROWSER_RUNNING_DIR` | Thư mục tạm cho browser đang chạy | `'.tmp/browser/running'` |
| `ENGINE_WORKING_DIR` | Thư mục làm việc cho engine | `'.tmp/browser/engine'` |

## Lưu ý

- **`headless: false` là bắt buộc.** Một số website chống bot kiểm tra dấu hiệu của headless mode. Nếu bạn set `headless: true`, fingerprint có thể bị phát hiện là giả.
- **`hasTouch: true`** được set mặc định vì hầu hết thiết bị thật đều có cảm ứng. Giúp fingerprint trông tự nhiên hơn.
- **Chỉ launch được một lần.** Bạn phải gọi `quit()` trước khi launch lại. Xem bảng Lifecycle ở trên.
- **Key được đọc từ biến môi trường.** Set `BABLOSOFT_KEY` trong file `.env` hoặc environment variable trước khi launch.
- **Profile được copy vào thư mục tạm** khi bạn dùng `useProfile()`. Browser chạy trên bản copy, không làm hỏng dữ liệu gốc. Khi quit, dữ liệu được copy ngược lại.

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|---|---|---|
| `Cannot find module 'playwright-core'` | Chưa cài playwright-core | `npm install playwright-core` |
| `[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan.` | Gọi launch() 2 lần | Gọi `quit()` trước khi launch lại |
| `[BrowserEngine] Phai goi launch() truoc khi tao context.` | Chưa launch mà gọi newContext() | Gọi `launch()` trước |
| `npm run clean` không chạy | Dùng `rm -rf` không hỗ trợ trên Windows | Dùng PowerShell: `Remove-Item -Recurse -Force dist` |

## Output build

Khi chạy `npm run build`, kết quả được tạo trong `dist/`:

```
dist/
├── index.js      # ESM format
├── index.cjs     # CommonJS format
├── index.d.ts    # TypeScript declaration file
└── index.d.cts   # Declaration cho CJS
```

---
