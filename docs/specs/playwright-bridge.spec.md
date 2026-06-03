# Spec: Playwright Bridge

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`PlaywrightFingerprintPlugin` là lớp bridge giữa `FingerprintPlugin` (plugin core) và Playwright `BrowserType`. Nó override `launchPersistentContext()` để inject fingerprint/proxy/profile vào BrowserContext thông qua engine, nhưng vẫn dùng Playwright để thực sự spawn browser.

Nói cách khác: plugin core quản lý fingerprint engine (C/C++), Playwright Bridge quản lý Playwright processes và kết nối chúng.

Source: `src/adapter/playwright/engine.ts` (100 dòng).

## Yêu cầu

- Kế thừa `FingerprintPlugin` để có toàn bộ lifecycle (setup, spawn, configure, cleanup).
- Constructor nhận `Launcher` tuỳ chỉnh — mặc định load Playwright từ `playwright-core`.
- `launch()` fallback sang `launchPersistentContext()` với warning — vì launch thuần không hỗ trợ fingerprint.
- `launchPersistentContext()` phải:
  - validate unsupported options trước khi launch.
  - ép `viewport: null` — fingerprint tự resize viewport, Playwright làm trước là thừa và gây conflict.
  - lược bỏ `--user-data-dir` khỏi args runtime — vì engine tự quản lý profile path.
  - thêm `--disable-extensions` vào `ignoreDefaultArgs` để tránh extension xung đột fingerprint.
- `configure()` phải:
  - đăng ký cleanup handler khi context close.
  - bind hooks cho page mới (viewport resize).
  - resize page đầu tiên nếu context đã có page.
- Chặn các option không hỗ trợ: `proxy`, `channel`, `firefoxUserPrefs`.

## Thiết kế

### Class hierarchy

```
FingerprintPlugin (src/plugin/index.ts)
  └── PlaywrightFingerprintPlugin (src/adapter/playwright/engine.ts)
       └── pwLauncher: Launcher (Playwright BrowserType)
```

### Luồng launchPersistentContext

```
User gọi launchPersistentContext(userDataDir, options)
  │
  ├─ #validateOptions(options) ─── kiểm tra proxy/channel/firefoxUserPrefs
  │
  ├─ Tạo launcher proxy:
  │    launch(opts) {
  │      filteredArgs = opts.args.filter(!--user-data-dir)
  │      return pwLauncher.launchPersistentContext(userDataDir, { ...opts, args: filteredArgs })
  │    }
  │
  ├─ _launch(false, {
  │     ...options,
  │     userDataDir,
  │     viewport: null,           ─── chống Playwright tự resize
  │     launcher: proxy,           ─── launcher proxy thay vì mặc định
  │     ignoreDefaultArgs: [
  │       ...options.ignoreDefaultArgs,
  │       '--disable-extensions',  ─── tránh extension xung đột fingerprint
  │     ],
  │   })
  │
  └─ _launch() gọi configure() sau spawn
       ├─ onClose(context, cleanup) ─── cleanup khi context close
       ├─ bindHooks(context, { onPageCreated: resize })
       └─ resize page đầu tiên (nếu có)
```

### Tại sao ép viewport: null

Playwright tự động set viewport cho context mới qua option `viewport`. Engine cũng tự resize viewport theo fingerprint data (qua CDP). Nếu cả hai cùng set, kết quả không xác định. Ép `null` để Playwright không can thiệp — engine làm việc này.

### Tại sao lược bỏ --user-data-dir

Engine chọn profile path và truyền cho Playwright. Nếu args từ user chứa `--user-data-dir`, nó override profile path của engine — làm profile management sai.

Tham chiếu design doc: `docs/designs/playwright-bridge.design.md`.

## API / Data flow

```ts
// Dùng qua BrowserEngine (không gọi trực tiếp)
import { BrowserEngine } from 'fingerprint-chromium-engine';
const engine = new BrowserEngine();
const context = await engine.launch().newContext();
```

### Input

- `launchPersistentContext(userDataDir: string, options: PluginLaunchOptions)`.
- `launch(options: PluginLaunchOptions)`.
- `configure(cleanup, browser, bounds, sync)` — gọi từ `_launch()`.

### Output

- `BrowserContext` — context có fingerprint, viewport đã resize.

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/adapter/playwright/engine.ts` | `PlaywrightFingerprintPlugin` class | 100 |
| `src/adapter/playwright/utils.ts` | `onClose`, `bindHooks`, `setViewport`, `getViewport` | — |
| `src/adapter/playwright/loader.ts` | Load Playwright chromium module | 10 |
| `src/plugin/index.ts` | Base class `FingerprintPlugin` | 270 |
| `src/plugin/config.ts` | `configure()` và `synchronize()` | — |

## Constants

| Constant | Giá trị | Vai trò |
|---|---|---|
| `IGNORED_ARGUMENTS` | `['--disable-extensions']` | Thêm vào `ignoreDefaultArgs` — tránh extension xung đột fingerprint injection. |
| `UNSUPPORTED_OPTIONS` | `['proxy', 'channel', 'firefoxUserPrefs']` | `proxy`: engine tự quản lý proxy ở tầng C/C++. `channel`: chỉ hỗ trợ Chromium. `firefoxUserPrefs`: không hỗ trợ Firefox. |
| `LAUNCH_FALLBACK_WARNING` | Chuỗi cảnh báo | Nhắc user dùng `launchPersistentContext` trực tiếp. |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Option không hỗ trợ (`proxy`, `channel`, `firefoxUserPrefs`) | Throw `PluginError('Option "<name>" không được hỗ trợ trong plugin này.')` |
| Launcher thiếu `launchPersistentContext` | Throw `PluginError('Launcher không hỗ trợ phương thức "launchPersistentContext".')` |
| `launch()` (không persistent) | In warning + fallback sang `launchPersistentContext('', options)` |
| Resize viewport thất bại | Warning, không throw — không làm crash launch chỉ vì viewport lệch |
| Browser close đột ngột | Cleanup handler chạy qua event `disconnected` |

## Kiểm tra

- Happy path: `launchPersistentContext()` trả về `BrowserContext` có fingerprint.
- Fallback: `launch()` in warning và gọi `launchPersistentContext()`.
- Validate: truyền `proxy`, `channel`, `firefoxUserPrefs` phải throw.
- Args: launcher proxy lược bỏ `--user-data-dir` khỏi args.
- Viewport: `configure()` resize page đầu tiên nếu bounds khác viewport hiện tại.
- Cleanup: context close → cleanup handler chạy.
