# Product: Hạ tầng dự án

## Tổng quan

`fingerprint-chromium-engine` là thư viện Node.js điều khiển Chromium với fingerprint thật, inject ở cấp C/C++. Hỗ trợ proxy đồng bộ, profile bền vững.

## Yêu cầu hệ thống

- **Node.js** >= 18
- **OS**: Windows (win32) -- 32-bit hoặc 64-bit
- **Playwright**: `playwright` >= 1.27.1 hoặc `playwright-core`

## Cài đặt

```bash
npm install fingerprint-chromium-engine
```

Cần cài Playwright riêng (peer dependency):

```bash
# Bản đầy đủ (có browser installer)
npm install playwright

# Hoặc chỉ core (nhẹ)
npm install playwright-core
```

## Sử dụng nhanh

```ts
import { Chromium } from 'fingerprint-chromium-engine';

// Bước 1: Cấu hình
Chromium.usePrivateKey(process.env.BABLOSOFT_KEY);

// Bước 2: Launch
await Chromium.launch({ headless: false });

// Bước 3: Tạo context + page
const context = await Chromium.newContext();
const page = await context.newPage();
await page.goto('https://example.com');

// Bước 4: Dọn dẹp
await Chromium.quit();
```

## Build và test

```bash
npm run build    # Build ESM + CJS + DTS vào dist/
npm test         # Chạy Mocha tests (cần browser thật)
npm run lint     # ESLint
npm run format   # Prettier format
```

## Lưu ý

- `headless: false` là bắt buộc -- một số fingerprint check phát hiện headless mode
- Key `BABLOSOFT_KEY` có thể set qua env hoặc gọi `usePrivateKey()`
- Chỉ launch được một lần -- phải `quit()` trước khi launch lại
