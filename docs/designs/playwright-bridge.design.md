# Design: Playwright Bridge

## Vấn đề

User dùng Playwright `BrowserType` API quen thuộc (`launch()`, `launchPersistentContext()`). Cần bridge để override các method này, inject fingerprint vào quy trình launch mà không thay đổi API.

## Giải pháp: PlaywrightFingerprintPlugin extends FingerprintPlugin

### Kế thừa + Override

```ts
class PlaywrightFingerprintPlugin extends FingerprintPlugin {
  protected pwLauncher: Launcher;

  constructor(launcher: Launcher = defaultLauncher) {
    super(); // Không truyền launcher → parent dùng useDefaultLauncher=false
  }
}
```

`defaultLauncher` lấy từ Playwright:
```ts
const browserType = defaultLoader.load<'chromium'>('chromium');
const defaultLauncher = {
  launch: browserType.launch.bind(browserType),
  launchPersistentContext: browserType.launchPersistentContext.bind(browserType),
};
```

### launch() và launchPersistentContext()

2 method public:

1. **launch(options)**: Gọi `this.launchPersistentContext('', options)` -- redirect về persistent context (vì engine luôn cần user data dir).

2. **launchPersistentContext(userDataDir, options)**: 
   - Validate options (throw nếu có `proxy`, `channel`, `firefoxUserPrefs`)
   - Filter `--user-data-dir` khỏi args (engine tự quản lý profile)
   - Gọi `this._launch(false, { ...options, launcher: customLauncher })`
   - `customLauncher.launch` gọi `pwLauncher.launchPersistentContext(userDataDir, filteredArgs)`
   - Kết quả là `BrowserContext` (Playwright API), không phải `Browser`

### configure() override

```ts
async configure(cleanup, browser, bounds, sync) {
  // browser thực chất là BrowserContext
  onClose(context, () => cleanup(context));
  if (bounds) {
    const resize = async (page) => {
      // Kiểm tra viewport hiện tại, nếu khác bounds thì gọi sync
      sync(() => setViewport(page, bounds));
    };
    bindHooks(context, { onPageCreated: resize });
    // Resize page đầu tiên nếu có
  }
}
```

### Ignored arguments

```ts
IGNORED_ARGUMENTS = ['--disable-extensions'];
UNSUPPORTED_OPTIONS = ['proxy', 'channel', 'firefoxUserPrefs'];
```

`--disable-extensions` bị loại bỏ vì fingerprint engine cần extensions hoạt động.

---

Xem thêm: [Spec](../specs/playwright-bridge.spec.md) | [Plan](../plans/playwright-bridge.plan.md)
