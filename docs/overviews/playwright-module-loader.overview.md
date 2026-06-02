# Overview: Playwright Module Loader

## Tóm tắt

Đã tạo generic `Loader` class: resolve package path (walk-up algorithm), validate version (compare-versions), return `LoaderResult` (version, package, executablePath, injectPlaywright flag). Tạo `PlaywrightLoader` adapter target `>= 1.27.1`, fallback packages `['playwright-core']`.

## Kiến trúc

```
Loader (src/loader/index.ts)
  |-- static create()                       factory method
  |-- load(options)                         resolve + validate + return
  |     |-- resolvePackage(packages)         walk-up find node_modules
  |     |-- getCoreVersion(packagePath)      read package.json version
  |     |-- validateVersion(versionGetter)   compare-versions >= minVersion
  |     |-- getChromiumExecutablePath()      createRequire + executablePath()
  |
  |-- static getPlaywrightModuleDir(name)    walk-up algorithm (10 levels)
  |-- private extractVersion(packagePath)    fallback version extraction

PlaywrightLoader (src/adapter/playwright/loader.ts)
  |-- static load()                         Loader.create().load({ fallbackPackages })
  |-- cachedResult                           singleton cache
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `LoaderResult` type | `src/types/loader.ts` | 1-10 |
| `Loader` class | `src/loader/index.ts` | 15-80 |
| `static create()` | `src/loader/index.ts` | 17-20 |
| `load()` | `src/loader/index.ts` | 22-50 |
| `resolvePackage()` | `src/loader/index.ts` | 52-65 |
| `static getPlaywrightModuleDir()` | `src/loader/index.ts` | 67-80 |
| `getCoreVersion()` | `src/loader/index.ts` | 82-90 |
| `validateVersion()` | `src/loader/index.ts` | 92-100 |
| `getChromiumExecutablePath()` | `src/loader/index.ts` | 102-115 |
| `PlaywrightLoader` class | `src/adapter/playwright/loader.ts` | 1-57 |

## Walk-up algorithm

```
getPlaywrightModuleDir(packageName):
  dir = __dirname
  for (i = 0; i < 10; i++):
    pkgPath = path.join(dir, 'node_modules', packageName)
    if (fs.existsSync(pkgPath)) return pkgPath
    dir = path.dirname(dir)
  return this.playwrightModuleDir   // fallback cached
```

**Tại sao 10 levels**: `__dirname` thay đổi sau tsup bundle. Walk-up tối đa 10 levels tương ứng với độ sâu bundle + node_modules nesting.

## Quyết định thiết kế

- **`createRequire` import CJS từ ESM**: `require` không dùng được khi bundle ESM. `createRequire(path.join(packagePath, 'package.json'))` tạo `require` function từ file path cụ thể. Không dùng `await import()` vì playwright-core là CJS module.
- **`resolvePackage()` iterate fallback packages**: `['playwright-core']` -- thử từng package, dùng package đầu tiên tìm thấy. Cho phép user dùng `playwright` (full) hoặc `playwright-core` (light).
- **`validateVersion()` dùng `compare-versions`**: So sánh semver chính xác. `compareVersions(version, '1.27.1') >= 0` đảm bảo version >= min.
- **`static create()` factory method**: Constructor private -- bắt user dùng factory. Dễ thêm singleton/logging trong tương lai.
- **PlaywrightLoader singleton cache**: `LoadResult` cached -- tránh resolve lại mỗi lần launch.

## Edge cases

- `require.resolve(package)` fail -> `resolvePackage` tiếp tục fallback package tiếp theo.
- Tất cả fallback fail -> throw `InvalidEngineError`.
- `JSON.parse(package.json)` fail -> throw `SyntaxError`.
- `pw.chromium.executablePath()` fail (Playwright not installed) -> throw.
- Version `1.27.0` < `1.27.1` -> throw version too old.

## Lưu ý

- Min version `1.27.1` -- Chromium 107+ CDP support.
- `fallbackPackages` default `['playwright-core']`.
- Walk-up algorithm up 10 levels -- dùng cho bundled + non-bundled.
- `createRequire(import.meta.url)` tạo require từ ESM context.

## Tài liệu liên quan

- `docs/designs/playwright-module-loader.design.md`
- `docs/specs/playwright-module-loader.spec.md`
- `docs/plans/playwright-module-loader.plan.md`
- `docs/products/playwright-module-loader.product.md`
- `src/loader/index.ts`
- `src/adapter/playwright/loader.ts`
