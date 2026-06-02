# Overview: FingerprintPlugin -- Core Orchestrator

## Tóm tắt

`FingerprintPlugin` là core orchestrator của toàn bộ hệ thống fingerprint. Quản lý Fluent API (useFingerprint, useProxy, useProfile, useBrowserVersion), gọi service (`fetch()`, `versions()`), setup engine, spawn `worker.exe`, cấu hình viewport và cleanup.

## Kiến trúc

```
FingerprintPlugin
  |-- ConnectorAPI           (api() -- giao tiếp engine)
  |-- BrowserLauncher        (spawn Chromium child process)
  |-- CleanerDaemon          (dọn file t/{pid}, s/{id}.ini)
  |-- NativeMutex            (Windows named mutex)
  |
  |-- Fluent API:
  |     useFingerprint(data, opts)     -> this.fingerprint
  |     useProxy(data, opts)           -> this.proxy
  |     useProfile(dir, opts)          -> this.profile
  |     useBrowserVersion(ver)         -> this.browserVersion
  |
  |-- _launch()
  |     setup -> spawn -> configure -> synchronize -> cleanup
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| Class declaration + options | `src/plugin/index.ts` | 27-96 |
| `static create()` | `src/plugin/index.ts` | 98-113 |
| `useFingerprint()` | `src/plugin/index.ts` | 115-119 |
| `useProxy()` | `src/plugin/index.ts` | 125-129 |
| `useProfile()` | `src/plugin/index.ts` | 143-147 |
| `useBrowserVersion()` | `src/plugin/index.ts` | 131-135 |
| `setProxyFromArguments()` | `src/plugin/index.ts` | 149-154 |
| `setServiceKey()` | `src/plugin/index.ts` | 137-141 |
| `setWorkingFolder()` | `src/plugin/index.ts` | 156-164 |
| `fetch()` / `versions()` | `src/plugin/index.ts` | 166-179 |
| `launch()` | `src/plugin/index.ts` | 181-221 |
| `_launch()` (6 bước) | `src/plugin/index.ts` | 223-280 |
| `cleanup()` | `src/plugin/index.ts` | 287-315 |
| `plugin` singleton + `create()` | `src/plugin/index.ts` | 322-323 |

## 6 bước trong `_launch()`

1. **Gọi `api('setup')`** -- gửi fingerprint, proxy, profile, browserVersion lên engine native.
2. **Gọi `api('start')`** -- engine spawn `worker.exe` (Chromium).
3. **Chọn launcher**: Nếu `useRepack`, dùng `repackLauncher`; nếu `customLauncher`, dùng custom; nếu `browserVersion` chỉ định, dùng version đó; nếu không, dùng mặc định từ `PlaywrightLoader`.
4. **Spawn browser** qua launcher `spawn()` hoặc `launch.launchPersistentContext()`.
5. **Configure** (`configure()`) -- cleanup handler, CDP resize viewport.
6. **Synchronize** (`synchronize()`) -- 2-phase sync `availWidth/availHeight` vào `.ini` file.

## Quyết định thiết kế

- **`setProxyFromArguments()`**: Chỉ fallback nếu `this.proxy` chưa set -- engine ưu tiên `useProxy()` hơn `--proxy-server` arg.
- **`defaultArgs()`**: Lọc `--headless` (engine ép headless: false), `--user-data-dir` (engine quản lý profile), `--start-maximized` (viewport control).
- **`_launch()` không có guard gọi một lần**: Guard này nằm ở `BrowserEngine` (public API). `FingerprintPlugin` có thể launch lại trong cùng vòng đời -- dùng cho testing.
- **`cleanup()` thứ tự dọn**: `browser.close()` -> `connector.cleanup()` -> `mutex.release()` -> `cleaner.stop()`. Không đảo thứ tự vì các component phụ thuộc nhau.

## Flow cleanup

```
cleanup()
  1. if (this.browser) this.browser.close()       -- đóng Chromium
  2. if (this.connectCleanup) this.connectCleanup() -- dọn connector (engine child process)
  3. if (this.mutex) this.mutex.release()           -- release native mutex
  4. if (this.cleaner) this.cleaner.stop()          -- stop cleanup daemon
```

## Lưu ý

- `plugin` singleton (`src/plugin/index.ts:322`) và `FingerprintPlugin.create()` đều có sẵn. Singleton dùng cho app một instance; `create()` cho multi-instance.
- `headless: false` được ép ngay trong bước spawn -- fingerprint check phát hiện headless mode.
- `synchronize()` dùng 2-phase: reset `BAS_NOT_SET` -> resize -> delay 2s -> set giá trị thật.

## Tài liệu liên quan

- `docs/designs/fingerprint-plugin.design.md`
- `docs/specs/fingerprint-plugin.spec.md`
- `docs/plans/fingerprint-plugin.plan.md`
- `docs/products/fingerprint-plugin.product.md`
- `src/plugin/index.ts`
