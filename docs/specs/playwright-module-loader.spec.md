# Spec: Playwright Module Loader

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Generic Loader class giúp resolve package, kiểm tra version >= minimum, và trả về property (vd: `chromium`). Playwright-specific instance tạo ra để support cả `playwright` (bản đầy đủ) lẫn `playwright-core` (bản nhẹ).

Nếu không tìm thấy package hoặc version không đạt tối thiểu, throw error hướng dẫn cài đặt.

Source: `src/loader/index.ts` (68 dòng), `src/adapter/playwright/loader.ts` (13 dòng).

## Yêu cầu

- Loader thử target package trước, fallback packages sau.
- Version phải >= minimum, so sánh dùng `compare-versions`.
- Phải hoạt động từ ESM context — dùng `createRequire` để require CJS package.
- Playwright instance: target `'playwright'`, minimum `1.27.1`, fallback `['playwright-core']`.
- Nếu property không tồn tại trên module, fallback về toàn bộ module (không throw).

## Thiết kế

### Class Loader

```ts
class Loader {
  constructor(target, version, packages)  // lưu cấu hình

  static import(packages)                 // thử require từng package
  load(property)                          // import + validate + trả về property
}
```

### resolve chain

```
Loader.load('chromium')
  │
  ├─ Loader.import(['playwright', 'playwright-core'])
  │    ├─ require('playwright')          → [OK] Kiểm tra version
  │    ├─ require('playwright')          → [FAIL] → fallback
  │    └─ require('playwright-core')     → [OK] Kiểm tra version
  │
  ├─ compare(version, '1.27.1', '<')
  │    ├─ [>=1.27.1] → OK
  │    └─ [<1.27.1]  → throw Error
  │
  └─ return module['chromium'] ?? module
```

### Tại sao dùng createRequire

File là ESM (`"type": "module"` trong package.json). `require` không có sẵn trong ESM. `createRequire` tạo CJS require function từ ESM context — cho phép load CJS package như `playwright-core`.

Tham chiếu design doc: `docs/designs/playwright-module-loader.design.md`.

## API / Data flow

```ts
import Loader from '../../loader';
import defaultLoader from '../adapter/playwright/loader';

// Generic usage
const loader = new Loader('playwright', '1.27.1', ['playwright-core']);
const chromium: BrowserType = loader.load('chromium');

// Default instance (pre-configured)
const browserType = defaultLoader.load('chromium');
```

### Class API

| Method | Input | Output | Mô tả |
|---|---|---|---|
| `Loader.import(packages)` | `string[]` | `[module, version]` hoặc `undefined` | Thử require từng package, return module đầu tiên |
| `Loader.load(property?)` | `string` (default `'chromium'`) | Module | import + validate version + return property |

### Error messages

| Tình huống | Message |
|---|---|
| Không tìm thấy package nào | `'None of the following packages could be found - "playwright", "playwright-core".'` |
| Version quá thấp | `'Version X of the "playwright" package is not supported - use version 1.27.1 or higher.'` |
| `import()` trả về undefined | `'Failed to resolve package "playwright".'` |

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/loader/index.ts` | Generic Loader class | 68 |
| `src/adapter/playwright/loader.ts` | Playwright instance (target 'playwright', min 1.27.1, fallback ['playwright-core']) | 13 |
| `src/adapter/playwright/engine.ts` | Dùng loader để lấy BrowserType | 111 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `Loader.import()` với packages rỗng | Return `undefined`, không throw |
| `Loader.load()` khi result undefined | Throw Error với message hướng dẫn cài đặt |
| Version thấp hơn minimum | Throw Error với version cụ thể + yêu cầu |
| Property không tồn tại | Fallback về module gốc, không throw |

## Kiểm tra

- Happy path: `playwright` hoặc `playwright-core` có sẵn, version >= 1.27.1 → load thành công.
- Edge case: packages rỗng → `import()` return undefined.
- Edge case: property không tồn tại → fallback module gốc (không crash).
- Error: cả 2 package đều không có → throw Error với message.
- Error: version quá thấp → throw Error với message.
