# Spec: Playwright Bridge

## File: `src/adapter/playwright/engine.ts` (111 dòng)

Module-level:

```ts
const browserType: BrowserType = defaultLoader.load();
const defaultLauncher: Launcher = {
  launch: browserType.launch.bind(browserType),
  launchPersistentContext: browserType.launchPersistentContext.bind(browserType),
};
```

---

## Hằng số

| Tên | Giá trị | Mô tả |
|---|---|---|
| `IGNORED_ARGUMENTS` | `['--disable-extensions']` | Loại bỏ khỏi args trước khi launch |
| `UNSUPPORTED_OPTIONS` | `['proxy', 'channel', 'firefoxUserPrefs']` | Throw error nếu có trong options |
| `LAUNCH_FALLBACK_WARNING` | Warning text | Cảnh báo khi gọi launch() thay vì launchPersistentContext() |

---

## Class `PlaywrightFingerprintPlugin`

```ts
class PlaywrightFingerprintPlugin extends FingerprintPlugin {
  protected readonly pwLauncher: Launcher;
}
```

### Constructor

```ts
constructor(launcher: Launcher = defaultLauncher)
```

Nhận `Launcher` (gồm `launch` và `launchPersistentContext`). Mặc định lấy từ Playwright BrowserType.
Gọi `super()` không truyền launcher -- `FingerprintPlugin` dùng mặc định (spawn worker.exe).

### `launch(options)`

```ts
async launch(options: PluginLaunchOptions = {}): Promise<BrowserContext>
```

| Bước | Hành vi |
|---|---|
| 1 | `#validateOptions(options)` |
| 2 | `console.warn(LAUNCH_FALLBACK_WARNING)` |
| 3 | `return this.launchPersistentContext('', options)` |

### `launchPersistentContext(userDataDir, options)`

```ts
async launchPersistentContext(
  userDataDir: string,
  options: PluginLaunchOptions = {}
): Promise<BrowserContext>
```

| Bước | Hành vi |
|---|---|
| 1 | `#validateOptions(options)` |
| 2 | Filter `--user-data-dir` khỏi `options.args` |
| 3 | Tạo custom launcher: `launch(opts) => pwLauncher.launchPersistentContext(userDataDir, {...opts, args: filteredArgs})` |
| 4 | Xử lý `ignoreDefaultArgs`: array thì concat `IGNORED_ARGUMENTS`, `true` thì giữ nguyên `true`, `false`/`undefined` thì dùng `IGNORED_ARGUMENTS` |
| 5 | Gọi `this._launch(false, { ...options, userDataDir, viewport: null, launcher })` |
| 6 | Return `BrowserContext` |

### `configure(cleanup, browser, bounds, sync)` -- Override

```ts
async configure(
  cleanup: (target: any) => void,
  browser: any,
  bounds: { width: number; height: number },
  sync: (fn: () => Promise<void>) => Promise<void>
): Promise<void>
```

| Bước | Hành vi |
|---|---|
| 1 | Cast `browser` thành `BrowserContext` |
| 2 | `onClose(context, () => cleanup(context))` -- lắng nghe close event |
| 3 | Nếu có bounds: tạo `resize(page)` function kiểm tra viewport hiện tại, gọi `sync(() => setViewport(page, bounds))` nếu khác |
| 4 | `bindHooks(context, { onPageCreated: resize })` -- proxy newPage + block setViewportSize |
| 5 | Nếu đã có page đầu tiên (`context.pages()[0]`), gọi `resize(firstPage)` ngay |

### `#validateOptions(options)` -- Private

```ts
#validateOptions(options: Record<string, unknown> = {}): void
```

Duyệt `UNSUPPORTED_OPTIONS`, nếu `option in options` thì throw `Error('Option "${option}" không được hỗ trợ...')`.

---

## Liên quan

| File | Vai trò |
|---|---|
| `src/adapter/playwright/engine.ts` | `PlaywrightFingerprintPlugin` |
| `src/adapter/playwright/loader.ts` | Loader Playwright module |
| `src/adapter/playwright/utils.ts` | `onClose`, `bindHooks`, `setViewport`, `getViewport` |
| `src/adapter/playwright/chromium.ts` | `Launcher`, `PluginLaunchOptions` types |
| `src/plugin/index.ts` | `FingerprintPlugin` (parent class) |

---

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `proxy`/`channel`/`firefoxUserPrefs` trong options | `#validateOptions` throw Error |
| Launcher thiếu `launchPersistentContext` | Throw `Error('Launcher không hỗ trợ phương thức...')` |
| Không cài playwright | `defaultLoader.load()` throw lỗi module not found |

---

## Kiểm tra

- Cần cài `playwright` hoặc `playwright-core` để test.
- Verify: `launch()` fallback sang `launchPersistentContext` và in warning.
- Verify: `UNSUPPORTED_OPTIONS` throw error đúng option.
- Verify: `--user-data-dir` bị filter khỏi args.
- Verify: `ignoreDefaultArgs` được merge đúng (array vs boolean).
- Verify: viewport page mới luôn được resize.

---
