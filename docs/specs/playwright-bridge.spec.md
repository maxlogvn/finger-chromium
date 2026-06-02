# Spec: Playwright Bridge

## Module: src/adapter/playwright/engine.ts

### Constants

| Tên | Giá trị | Mô tả |
|---|---|---|
| `IGNORED_ARGUMENTS` | `['--disable-extensions']` | Loại bỏ khỏi args |
| `UNSUPPORTED_OPTIONS` | `['proxy', 'channel', 'firefoxUserPrefs']` | Throw nếu có |
| `LAUNCH_FALLBACK_WARNING` | `string` | Warning khi dùng launch() thay vì launchPersistentContext() |

### Class PlaywrightFingerprintPlugin

```ts
class PlaywrightFingerprintPlugin extends FingerprintPlugin {
  protected pwLauncher: Launcher;

  constructor(launcher: Launcher = defaultLauncher);
  
  async launch(options: PluginLaunchOptions = {}): Promise<BrowserContext>;
  async launchPersistentContext(userDataDir: string, options: PluginLaunchOptions = {}): Promise<BrowserContext>;
  async configure(cleanup, browser, bounds, sync): Promise<void>;
}
```

### launchPersistentContext flow

```
1. #validateOptions(options) → throw nếu có proxy/channel/firefoxUserPrefs
2. Filter --user-data-dir khỏi options.args
3. Tạo custom launcher:
   launcher.launch = (opts) => pwLauncher.launchPersistentContext(userDataDir, opts)
4. Gọi this._launch(false, {
     ...options,
     viewport: null,
     ignoreDefaultArgs: [...IGNORED_ARGUMENTS],
     launcher,
   })
5. Return BrowserContext
```

### configure() flow

```
1. onClose(context, () => cleanup(context))
2. Nếu có bounds:
   a. Tạo resize function
   b. bindHooks(context, { onPageCreated: resize })
   c. Nếu page đầu tiên có sẵn → resize ngay
```
