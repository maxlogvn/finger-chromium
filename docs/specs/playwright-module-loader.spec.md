# Spec: Playwright Module Loader

## Module: src/loader/index.ts (68 dòng)

### Class Loader

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
| `packages` | `['playwright-core']` | Fallback packages |

### Static import()

```
Input: ['playwright-core']
Flow:
  for each id in packages:
    try require(id)
    try require(id + '/package.json').version
    return [module, version]
  throw Error if none found
Output: [module, versionString] | throw
```

### Instance load()

```
Input: 'chromium'
Flow:
  1. result = Loader.import([target, ...packages])
  2. if !result → throw
  3. compare(version, this.version, '<') → throw if too old
  4. return module[property] ?? module
Output: T (typed)
```

## Module: src/adapter/playwright/loader.ts (13 dòng)

```ts
const loader = new Loader('playwright', '1.27.1', ['playwright-core']);
export default loader;
```

Dùng trong `engine.ts`:
```ts
const browserType = defaultLoader.load<'chromium'>('chromium');
```

## Error messages

| Tình huống | Message |
|---|---|
| Không tìm thấy package nào | `None of the following packages could be found - "playwright", "playwright-core".` |
| Version quá thấp | `Version 1.25.0 of the "playwright" package is not supported - use version 1.27.1 or higher.` |
| Loader.import() rỗng | `Failed to resolve package "playwright".` |
