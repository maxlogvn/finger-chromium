# Product: BrowserEngine

## Tổng quan

BrowserEngine là public API chính. Dùng singleton `Chromium` với Fluent API.

## Cách dùng

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const context = await Chromium
  .useFingerprint(fpData, { usePerfectCanvas: true })
  .useProxy('http://user:pass@proxy:8080', { changeTimezone: true })
  .useProfile('./profiles/user_01')
  .launch({ headless: false })
  .newContext();

const page = await context.newPage();
await page.goto('https://example.com');

await Chromium.quit();
```

## Lưu ý

- `launch()` chỉ được gọi **một lần**
- `newContext()` chỉ tạo được một context, gọi `quit()` trước khi tạo mới
- Profile tự động được lưu khi `quit()`
