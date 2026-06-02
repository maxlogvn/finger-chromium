# Product: Playwright Module Loader

## Tổng quan

Loader tự động tìm kiếm playwright trong `node_modules`, hỗ trợ cả `playwright` lẫn `playwright-core`. Nếu không tìm thấy, throw error hướng dẫn cài đặt.

## Cách hoạt động

Quy trình resolve:

1. Thử `require('playwright')` -- nếu có (bản đầy đủ), dùng luôn.
2. Nếu không, thử `require('playwright-core')` -- bản nhẹ hơn, chỉ có core API.
3. Kiểm tra version >= 1.27.1.
4. Trả về `module.chromium` (BrowserType).

```ts
// Trong engine.ts -- tự động resolve
import defaultLoader from './loader';
const browserType = defaultLoader.load<'chromium'>('chromium');
```

## Cài đặt playwright

```bash
# Option 1: Bản đầy đủ (recommended)
npm install playwright

# Option 2: Chỉ core (nhẹ hơn)
npm install playwright-core
```

## Version requirement

Minimum: **1.27.1**. Nếu version thấp hơn, bạn sẽ thấy lỗi:

```
Version 1.25.0 of the "playwright" package is not supported - use version 1.27.1 or higher.
```

---
