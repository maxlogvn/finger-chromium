# Design: Playwright Bridge

## Vấn đề

`FingerprintPlugin` spawn worker.exe trực tiếp và trả về `Browser` (process handle). User dùng Playwright cần `BrowserContext` với đầy đủ API Playwright (page, evaluate, v.v.).

Cần một bridge để:
- Giữ nguyên API Playwright quen thuộc (`launchPersistentContext()`).
- Inject fingerprint qua engine binary.
- Trả về `BrowserContext` thay vì `Browser`.

## Giải pháp

Class `PlaywrightFingerprintPlugin` extends `FingerprintPlugin`, override 3 method chính:

### 1. launch() -- Fallback

`launch()` không được support đầy đủ. Nó validate options, in warning, rồi gọi `launchPersistentContext('', options)`.

Lý do: engine binary luôn cần user data dir (persistent context). Launch thuần không có user data dir.

### 2. launchPersistentContext() -- Core

Đây là method chính. Luồng xử lý:

```
launchPersistentContext(userDataDir, options)
  │
  ├── #validateOptions(options) → throw nếu có proxy/channel/firefoxUserPrefs
  │
  ├── Tạo custom launcher:
  │     launch(opts) = pwLauncher.launchPersistentContext(userDataDir, filteredArgs)
  │   Trong đó: filteredArgs = opts.args.filter(arg → !arg.startsWith('--user-data-dir'))
  │
  └── Gọi this._launch(false, {
        ...options,
        userDataDir,
        viewport: null,
        launcher: { launch: customLauncher },
        ignoreDefaultArgs: merge với IGNORED_ARGUMENTS,
      })
        │
        └── FingerprintPlugin._launch() spawn worker.exe
              qua custom launcher → return BrowserContext
```

**`useDefaultLauncher = false`**: báo cho `_launch()` dùng custom launcher thay vì spawn worker.exe trực tiếp.

### 3. configure() -- Override

Override để xử lý `BrowserContext` thay vì `Browser`:

```ts
configure(cleanup, browser, bounds, sync):
  // browser thực chất là BrowserContext
  onClose(context, () => cleanup(context))
  Nếu có bounds:
    bindHooks(context, { onPageCreated: page => resize(page) })
    Resize page đầu tiên nếu có
```

### Ignored Arguments

`--disable-extensions` bị loại bỏ vì fingerprint engine cần extensions để inject fingerprint.

### Unsupported Options

`proxy`, `channel`, `firefoxUserPrefs` bị chặn vì:
- **proxy**: Engine binary quản lý proxy riêng qua `useProxy()`.
- **channel**: Engine chỉ dùng Chromium mặc định.
- **firefoxUserPrefs**: Chỉ Firefox mới có.

---

Xem thêm: [Spec](../specs/playwright-bridge.spec.md) | [Plan](../plans/playwright-bridge.plan.md)
