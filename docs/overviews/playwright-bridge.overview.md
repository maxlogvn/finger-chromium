# Overview: Playwright Bridge

## Tóm tắt

`PlaywrightFingerprintPlugin` là bridge giữa `FingerprintPlugin` (core logic) và Playwright `BrowserType` (chromium). Override `launch()` và `launchPersistentContext()` để inject fingerprint, proxy, profile manager. Tất cả bước trong plan hoàn thành đúng kế hoạch.

## Kiến trúc

```
PlaywrightFingerprintPlugin
  |-- FingerprintPlugin    (core: setup, spawn, cleanup)
  |-- BrowserLauncher      (spawn Chromium child process)
  |-- configure()          (viewport resize + hook binding)
  |-- synchronize()        (2-phase sync engine config)
  |
  |-- prepareContext()     (filter args, validate unsupported options)
  |-- bindLauncher()       (monkeypatch BrowserType.launch/launchPersistentContext)
  |-- validatePlaywrightOptions()
```

**Flow launch:**
```
FingerprintPlugin._launch()
  -> api('setup')             gửi config lên engine
  -> spawn worker.exe         engine spawn Chromium
  -> configure()              resize viewport + CDP setup
  -> synchronize()            2-phase sync .ini file
  -> Browser.configure()      lưu Browser reference

PlaywrightFingerprintPlugin.launchPersistentContext()
  -> prepareContext()         filter args, validate options
  -> BrowserType.launchPersistentContext()   Playwright launch
  -> bindHooks()              proxy viewport, close handler
  -> configure()              resize Playwright path
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| Class declaration | `src/adapter/playwright/engine.ts` | 20-46 |
| `FingerprintPlugin` instance | `src/adapter/playwright/engine.ts` | 28-32 |
| `bindLauncher()` | `src/adapter/playwright/engine.ts` | 48-62 |
| `validatePlaywrightOptions()` | `src/adapter/playwright/engine.ts` | 64-89 |
| `prepareContext()` | `src/adapter/playwright/engine.ts` | 91-120 |
| `launchPersistentContext()` | `src/adapter/playwright/engine.ts` | 122-153 |
| `_launch()` (FingerprintPlugin) | `src/plugin/index.ts` | 223-280 |

## Quyết định thiết kế

- **Override `launchPersistentContext` thay vì `launch`**: Persistent context cho phép Playwright quản lý profile -- phù hợp với useProfile().
- **`validatePlaywrightOptions()`**: Kiểm tra proxy, channel, firefoxUserPrefs -- những options không hỗ trợ trong chế độ fingerprint. Ném lỗi sớm tránh debug khó khăn.
- **`prepareContext()`**: Lọc ignored Chromium args (`--disable-background-networking`, `--disable-sync`, etc.) -- engine cần những flag này để inject fingerprint.
- **`bindLauncher()`**: Monkeypatch `BrowserType.launch` và `launchPersistentContext` -- user không cần change import.
- **`configure()` gọi sau launch**: Resize viewport + bind hooks -- đảm bảo browser đã sẵn sàng trước khi user dùng.

## Flow validate option

```
prepareContext(options)
  -> validatePlaywrightOptions(options)
     -> proxy?       throw 'Không hỗ trợ proxy Playwright, dùng useProxy()'
     -> channel?     throw 'Không hỗ trợ channel, dùng browser version mặc định'
     -> firefoxUserPrefs? throw 'Chỉ hỗ trợ Chromium'
  -> filter ignored args (--disable-background-networking, --disable-sync, ...)
  -> ép viewport = null (engine quản lý viewport)
```

## Ignored Chromium args

Các arg bị filter bởi `prepareContext()` vì engine cần set:
- `--disable-background-networking`
- `--disable-sync`
- `--disable-translate`
- `--disable-default-apps`
- `--disable-logging`
- `--disable-breakpad`
- `--window-size` (engine quản lý viewport)

## Lưu ý

- Chỉ override `launchPersistentContext` -- `launch` dùng default Playwright (không profile).
- `configure()` có 2 implementation: CDP path (plugin/browser.ts) và CDPSession path (adapter/playwright/utils.ts).
- Engine binary quản lý toàn bộ vòng đời Chromium -- Playwright chỉ là lớp điều khiển.
- `useProfile()` cần map profile trước khi gọi `launchPersistentContext`.

## Tài liệu liên quan

- `docs/designs/playwright-bridge.design.md`
- `docs/specs/playwright-bridge.spec.md`
- `docs/plans/playwright-bridge.plan.md`
- `docs/products/playwright-bridge.product.md`
- `src/adapter/playwright/engine.ts`
- `src/plugin/index.ts`
