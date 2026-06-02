# Product: Hạ tầng dự án

## Tổng quan

Thư viện `fingerprint-chromium-engine` cung cấp API fluent để điều khiển Chromium với fingerprint thật.

## Cài đặt

```bash
npm install fingerprint-chromium-engine
```

Yêu cầu Node.js >= 18, Windows (win32).

## Sử dụng cơ bản

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const context = await Chromium
  .usePrivateKey('your-key')
  .useFingerprint('{...fingerprint JSON...}')
  .useProxy('http://user:pass@proxy:8080')
  .useProfile('./profile')
  .launch()
  .newContext();

const page = await context.newPage();
// Sử dụng page như bình thường

await Chromium.quit();
```

## Các lệnh phát triển

```bash
npm run build    # Build ESM + CJS + DTS
npm test         # Chạy mocha tests
npm run lint     # ESLint
npm run format   # Prettier
```
