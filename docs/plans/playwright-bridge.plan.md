# Plan: Playwright Bridge

- [x] Bước 1: Tạo loader cho playwright (target >= 1.27.1)
- [x] Bước 2: Load BrowserType từ playwright (default: chromium)
- [x] Bước 3: Tạo PlaywrightFingerprintPlugin extends FingerprintPlugin
- [x] Bước 4: Override launch() và launchPersistentContext()
- [x] Bước 5: Override configure() cho BrowserContext + bindHooks
- [x] Bước 6: Implement option validation (unsupported options)
- [x] Bước 7: Tích hợp defaultLauncher (browserType.launchPersistentContext)
