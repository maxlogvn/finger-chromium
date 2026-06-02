# Spec: FingerprintPlugin

## File: `src/plugin/index.ts` (282 dòng)

Module-level:
- `let serviceKey: string | undefined` -- global key cho mọi instance.
- `export const plugin = new FingerprintPlugin()` -- singleton instance mặc định.

---

## Class `FingerprintPlugin`

### Properties

| Property | Kiểu | Mô tả |
|---|---|---|
| `launcher` | `{ launch: (opts) => Promise<Browser> }` | Launcher instance (default hoặc custom) |
| `version` | `string \| null` | Version browser, mặc định `'default'` |
| `fingerprint` | `PluginConfig \| undefined` | Fingerprint config (value + options) |
| `profile` | `PluginConfig \| undefined` | Profile config |
| `proxy` | `PluginConfig \| undefined` | Proxy config |

### Constructor

```ts
constructor(launcherInstance?: { launch: (opts) => Promise<Browser> })
```

Nếu không truyền launcher, dùng mặc định (`launch` từ `./launcher`).

### Factory Method

```ts
static create(launcherInstance): FingerprintPlugin
```

Validate launcher bằng `validateLauncher()` rồi gọi constructor.

### Fluent Configuration Methods

| Method | Tham số | Hành vi |
|---|---|---|
| `useFingerprint(value, options)` | `string`, `FingerprintOptions` | Validate + lưu `this.fingerprint` |
| `useProfile(value, options)` | `string`, `ProfileOptions` | Validate + lưu `this.profile` |
| `useProxy(value, options)` | `string`, `ProxyOptions` | Validate + lưu `this.proxy` |
| `useBrowserVersion(version)` | `string` | Set `this.version` (default `'default'`) |

Tất cả đều `return this` -- hỗ trợ chaining.

### Config Helper Methods

| Method | Tham số | Hành vi |
|---|---|---|
| `setProxyFromArguments(args)` | `string[]` | Nếu `this.proxy == null`, parse `--proxy-server` từ args |
| `setWorkingFolder(folder)` | `string` | Gọi `engine.setCwd(path.resolve(folder))` |
| `setRequestTimeout(timeout)` | `number` | Gọi `engine.setRequestTimeout(timeout \|\| 0)` |
| `setEngineTimeout(timeout)` | `number` | Gọi `engine.setEngineTimeout(timeout \|\| 0)` |
| `setServiceKey(key)` | `string` | Gán `serviceKey = key` (module-level) |

### Runtime Methods

| Method | Tham số | Trả về | Hành vi |
|---|---|---|---|
| `fetch(options)` | `FetchOptions` | `Promise<string>` | Gọi `api('fetch', { key, options, version })` |
| `versions(format)` | `'default' \| 'extended'` | `Promise<string[]> \| Promise<Version[]>` | Gọi `api('versions', { format })` |
| `spawn(options)` | `BaseLaunchOptions` | `Promise<Browser>` | Gọi `_launch(true, options)` |

### Protected Methods

#### `configure(...args)`

Wrapper pass-through gọi `configure` từ `config.ts`. Playwright bridge override method này để nhận `BrowserContext` thay vì `Browser`.

#### `_launch(useDefaultLauncher, options)` -- Core Lifecycle

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `setProxyFromArguments(options.args)` | Fallback proxy từ args nếu chưa config |
| 2 | `api('setup', { proxy, fingerprint, version, profile, pid, key })` | Gửi config xuống engine, nhận `SetupResponse` |
| 3 | `cleaner.watch(pwd).ignore(pwd, pid, id)` | Đăng ký cleanup cho thư mục pwd |
| 4 | `mutex.create(\`BASProcess${pid}\`)` | Tạo Windows named mutex |
| 5. | Chọn launcher | `useDefaultLauncher` → plugin's launch; else → `options.launcher \|\| this.launcher` |
| 6. | `activeLauncher.launch(options)` | Spawn worker.exe với args đã lọc |
| 7. | `configure(...)` | Resize viewport + đồng bộ .ini |

**SetupResponse**:

```ts
interface SetupResponse {
  id: string;       // Unique process ID
  pid: string;      // Process ID cho mutex
  pwd: string;      // Working directory
  path: string;     // Browser executable path
  bounds: ViewportBounds;  // Viewport dimensions
  [key: string]: unknown;  // Engine có thể thêm field
}
```

**Launch params hardcoded**:

```ts
{
  headless: false,          // Fingerprint check phát hiện headless
  userDataDir: undefined,   // Engine tự quản lý user data
  defaultViewport: undefined, // Viewport set riêng qua configure()
  executablePath: `${browserPath}/worker.exe`,
  args: [
    `--parent-process-id=${pid}`,
    `--unique-process-id=${id}`,
    ...defaultArgs({ ...options, ...config }),
  ],
}
```

### Profile Fallback

Nếu `this.profile` chưa set, `_launch()` tự động tạo profile config từ args:

```ts
{
  value: getProfilePath(options),
  options: { loadProxy: true, loadFingerprint: true },
}
```

---

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/index.ts` | Class `FingerprintPlugin` |
| `src/plugin/config.ts` | `configure()` + `synchronize()` |
| `src/plugin/browser.ts` | `setViewport()` + `getViewport()` |
| `src/plugin/utils.ts` | `defaultArgs()`, `getProfilePath()`, `validateConfig()`, `validateLauncher()` |
| `src/plugin/launcher/index.ts` | `launch()` -- spawn worker.exe |
| `src/plugin/connector/index.ts` | `api()` -- gọi API engine |
| `src/plugin/mutex/index.ts` | `create()` -- Windows mutex |
| `src/plugin/cleaner.ts` | File cleanup daemon |

---

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `validateConfig` fail (value không phải string) | Throw `Error('Tham so khong hop le...')` |
| `validateLauncher` fail (không có method launch) | Throw `Error('Browser launcher khong duoc ho tro...')` |
| API `setup` timeout | Engine quăng `EngineTimeoutError` |
| API `fetch` timeout | Engine quăng `RequestTimeoutError` |
| Mutex không support (non-Windows) | `create()` throw lỗi platform |

---

## Kiểm tra

- Test cần engine binary thật (`worker.exe`) -- không thể mock hoàn toàn.
- Test edge case: `setProxyFromArguments` sau `useProxy` -- proxy không bị ghi đè.
- Test edge case: launch không có `useProfile` -- fallback dùng `getProfilePath`.
- Test 2 instance cùng `serviceKey` -- không conflict.

---
