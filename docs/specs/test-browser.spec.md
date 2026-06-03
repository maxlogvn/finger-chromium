# Spec: Test Browser (Launcher + BrowserEngine + PlaywrightBridge)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Viết test suite cho 4 module Browser: `launcher` (spawn Chromium process), `utils` (type guard, hook binding, viewport management), `engine` (PlaywrightFingerprintPlugin bridge), `chromium` (BrowserEngine fluent API). Dùng integration test với Playwright Chromium thật.

## Yêu cầu

- Tất cả test dùng Playwright Chromium thật (`playwright-core`), không mock browser.
- Skip test nếu không tìm thấy `playwright.chromium.executablePath()`.
- Mỗi test tự cleanup hoàn toàn (close browser, close context, detach CDP).
- Timeout mỗi test: 30s (cho phép Chromium spawn kịp).
- Không phụ thuộc engine binary bablosoft (`FastExecuteScript.exe`).
- Tuân thủ convention codebase: `node:assert`, mocha, tiếng Việt trong `it()`.

## Thiết kế

Tham chiếu: `docs/designs/test-browser.design.md`

File test duy nhất: `tests/browser.test.ts`. Cấu trúc:

```
tests/browser.test.ts
├── describe('Launcher')
├── describe('Utils')
├── describe('PlaywrightFingerprintPlugin')
└── describe('BrowserEngine')
```

Mỗi describe có `before`/`after` hooks riêng để setup/teardown.

## API / Data flow

### Helper `getChromiumExecutablePath()`
```
Input:  (none)
Output: string | null -- executablePath từ playwright.chromium
Logic:  Dùng playwright.chromium.executablePath()
        Ném null nếu không tìm thấy (dùng trong describe.skip)
```

### Helper `launchBrowser()`
```
Input:  executablePath, options { headless, args, debuggingPort? }
Output: Browser object { process, port, url }
Logic:  Gọi launch() từ src/plugin/launcher/index.ts
```

## Components

### File sửa
- `tests/browser.test.ts` (tạo mới) -- toàn bộ test suite.

### Module cần test
| File | Trách nhiệm |
|------|-------------|
| `src/plugin/launcher/index.ts` | `launch()`, `Browser` interface |
| `src/adapter/playwright/utils.ts` | `isBrowser`, `onClose`, `bindHooks`, `setViewport`, `getViewport` |
| `src/adapter/playwright/engine.ts` | `PlaywrightFingerprintPlugin` constructor, `launch`, `launchPersistentContext`, `configure` |
| `src/adapter/playwright/chromium.ts` | `BrowserEngine` constructor, fluent API, lifecycle, guards |

## Xử lý lỗi

| Tình huống | Xử lý |
|------------|-------|
| Chromium binary không có | `describe.skip` -- test bị bỏ qua, không fail |
| `launch()` timeout | Retry 1 lần với port khác, nếu vẫn timeout throw `PluginError` |
| `close()` gọi 2 lần | Lần 2 không throw |
| `quit()` chưa launch | Không throw |
| `launch()` gọi 2 lần | Throw `PluginError` |
| `newContext()` trước `launch()` | Throw `PluginError` |

## Kiểm tra

### Launcher (7 tests)
1. `launch()` spawn Chromium thành công -- assert trả về Browser object đúng shape.
2. `launch()` timeout khi DevTools URL không xuất hiện -- throw PluginError.
3. `launch()` với port cụ thể -- assert port khớp.
4. `launch()` với `headless: true` -- assert browser chạy headless.
5. `Browser.close()` kill process thành công.
6. `Browser.close()` idempotent -- gọi 2 lần không throw.
7. `Browser.configure()` là no-op -- không throw.

### Utils (8 tests)
1. `isBrowser(browser)` trả về true.
2. `isBrowser(context)` trả về false.
3. `isBrowser({})` trả về false.
4. `onClose(browser, cb)` -- cb được gọi khi browser close.
5. `onClose(context, cb)` -- cb được gọi khi context close.
6. `bindHooks(context, hooks)` -- onPageCreated được gọi.
7. `bindHooks(context, hooks)` -- setViewportSize bị chặn.
8. `setViewport(page, {width, height})` -- resize thành công.

### PlaywrightFingerprintPlugin (9 tests)
1. Constructor với pwLauncher mặc định.
2. Constructor với launcher custom.
3. `launchPersistentContext()` trả về BrowserContext.
4. `launchPersistentContext()` filter `--user-data-dir` args.
5. `launchPersistentContext()` force `viewport: null`.
6. `launchPersistentContext()` throw khi có `proxy` option.
7. `launchPersistentContext()` throw khi có `channel` option.
8. `launchPersistentContext()` throw khi có `firefoxUserPrefs`.
9. `configure()` gọi `onClose` và `bindHooks`.

### BrowserEngine (14 tests)
1. Constructor với defaults.
2. Constructor với launcher custom.
3. `repackChromium()` thay thế launcher.
4. `useFingerprint()` lưu data + options.
5. `useProxy()` lưu proxy data + options.
6. `useProfile()` map profile directory.
7. `launch()` thành công.
8. `launch()` guard -- 1 lần duy nhất.
9. `newContext()` sau launch thành công.
10. `newContext()` guard -- chưa launch.
11. `quit()` cleanup thành công.
12. `quit()` idempotent.
13. `quit()` chưa launch.
14. `newFingerprint()` fetch fingerprint.

Tổng cộng: **38 tests**.
