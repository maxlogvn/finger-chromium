# Product: Playwright Module Loader

## Mô tả

Loader tự động tìm kiếm Playwright trong `node_modules`, hỗ trợ cả `playwright` (bản đầy đủ) lẫn `playwright-core` (bản nhẹ). Nếu không tìm thấy hoặc version không đạt tối thiểu, throw error hướng dẫn cài đặt.

## Cách sử dụng

```ts
import defaultLoader from './adapter/playwright/loader';
// Tự động resolve: thử 'playwright' -> 'playwright-core'
const browserType = defaultLoader.load<'chromium'>('chromium');
// browserType là Playwright BrowserType.chromium
```

Cài đặt Playwright:

```bash
# Option 1: Bản đầy đủ (recommended)
npm install playwright

# Option 2: Chỉ core (nhẹ hơn)
npm install playwright-core
```

## Hành vi chi tiết

Quy trình resolve:

1. Thử `require('playwright')` — nếu có (bản đầy đủ), dùng luôn.
2. Nếu không, thử `require('playwright-core')` — bản nhẹ hơn.
3. Kiểm tra version >= **1.27.1** (so sánh bằng `compare-versions`).
4. Trả về `module.chromium` (BrowserType cho Chromium).
5. Nếu property `chromium` không tồn tại, trả về toàn bộ module (fallback cho cấu trúc module lạ).

Loader class trong `src/loader/index.ts` cung cấp cơ chế resolve tổng quát. `src/adapter/playwright/loader.ts` là instance dùng config mặc định (target `>= 1.27.1`, fallback packages `['playwright-core']`).

## Giới hạn và điều kiện

- Yêu cầu Playwright Core >= 1.27.1 (peer dependency).
- Chỉ hoạt động với CJS packages (dùng `createRequire`).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/playwright-module-loader.spec.md`
- Design: `docs/designs/playwright-module-loader.design.md`
- Source: `src/loader/index.ts`, `src/adapter/playwright/loader.ts`
