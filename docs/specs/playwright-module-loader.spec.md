# Spec: Playwright Module Loader

## File: `src/loader/index.ts` (68 dòng) + `src/adapter/playwright/loader.ts` (13 dòng)

### Class `Loader`

```ts
class Loader {
  constructor(target: string, version: string, packages: string[] = []);
  static import(packages: string[] = []): [any, string] | undefined;
  load<T = any>(property = 'chromium'): T;
}
```

### Constructor params

| Param | Ví dụ | Mô tả |
|---|---|---|
| `target` | `'playwright'` | Package ưu tiên cao nhất |
| `version` | `'1.27.1'` | Minimum version requirement |
| `packages` | `['playwright-core']` | Fallback packages (thử sau target) |

### Static `import()`

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `if (!packages.length) return undefined` | Packages rỗng -> undefined |
| 2 | `for (const id of packages)` | Duyệt packages |
| 2a | `const mod = require(id)` | Thử require |
| 2b | `const pkgVersion = require(id + '/package.json').version` | Lấy version |
| 2c | `return [mod, pkgVersion]` | Return ngay khi tìm thấy |
| 3 | `throw new Error(...)` | Không tìm thấy package nào |

### Instance `load()`

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `result = Loader.import([this.target, ...this.packages])` | Thử target trước, fallback sau |
| 2 | `if (!result) throw` | Import fail |
| 3 | `const [module, version] = result` | Destructure |
| 4 | `if (version && this.version && compare(version, this.version, '<')) throw` | Version quá thấp |
| 5 | `return property in module ? module[property] : module` | Lấy property hoặc fallback |

### Playwright Loader Instance

```ts
// src/adapter/playwright/loader.ts
const loader = new Loader('playwright', '1.27.1', ['playwright-core']);
export default loader;

// Dùng trong engine.ts:
const browserType = defaultLoader.load<'chromium'>('chromium');
```

### Error messages

| Tình huống | Message |
|---|---|
| Không tìm thấy package nào | `'None of the following packages could be found - "playwright", "playwright-core".'` |
| Version quá thấp | `'Version X of the "playwright" package is not supported - use version 1.27.1 or higher.'` |
| Loader.import() không có packages | `'Failed to resolve package "playwright".'` |

---

## Kiểm tra

- Loader.import() với packages rỗng -> undefined, không throw.
- Loader.load() khi property không tồn tại -> fallback module gốc.
- `compare-versions` chỉ hoạt động với semver format.

---
