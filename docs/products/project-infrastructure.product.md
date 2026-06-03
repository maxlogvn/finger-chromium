# Product: Hạ tầng dự án (Project Infrastructure)

## Mô tả

`fingerprint-chromium-engine` là thư viện Node.js giúp điều khiển Chromium qua Playwright với fingerprint thật, bypass bot detection. Fingerprint được inject ở tầng C/C++ trước khi browser khởi động — không có dấu hiệu override trong JavaScript context.

Chỉ hỗ trợ Windows 32-bit và 64-bit.

## Cách sử dụng

### Cài đặt

```bash
npm install github:maxlogvn/finger-chromium
npm install playwright-core   # peer dependency
npx playwright install chromium
```

### Ví dụ nhanh

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();

const fingerprintData = await engine.newFingerprint({
  tags: ['Microsoft Windows', 'Chrome'],
});

const context = await engine
  .useFingerprint(fingerprintData, { safeWebGL: true })
  .launch({ headless: false })
  .newContext();

const page = await context.newPage();
await page.goto('https://example.com');

await engine.quit();
```

### Các lệnh phát triển

| Lệnh | Mô tả |
|---|---|
| `npm run lint` | ESLint |
| `npm run format` | Prettier format |
| `npm test` | Mocha tests (cần browser thật) |
| `npm run build` | Build ESM + CJS + DTS qua tsup |
| `npm run clean` | Xoá dist (tsup --clean, Windows-compatible) |

## Hành vi chi tiết

- `launch()` chỉ gọi được một lần. Gọi lần 2 throw error.
- `newContext()` chỉ gọi được sau `launch()`, trước `quit()`.
- `quit()` dọn dẹp context, profile, engine process, mutex, cleaner. PCAP server vẫn tồn tại vì là singleton dùng chung cho process.
- `headless: false` mặc định — fingerprint check phát hiện headless mode.

## Giới hạn và điều kiện

- Node.js >= 18, Windows (win32) 32-bit hoặc 64-bit.
- `playwright-core` >= 1.60 (peer dependency — phải tự cài).
- Biến môi trường bắt buộc: `BABLOSOFT_KEY`. Tuỳ chọn: `BROWSER_RUNNING_DIR`, `ENGINE_WORKING_DIR`.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/project-infrastructure.spec.md`
- Design: `docs/designs/project-infrastructure.design.md`
- Source: `src/index.ts`
