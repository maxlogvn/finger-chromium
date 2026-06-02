# Spec: FingerprintPlugin

## Class: FingerprintPlugin (282 dòng)

### Properties

```ts
protected launcher: { launch: (opts) => Promise<Browser> };
protected version: string | null;           // default 'default'
protected fingerprint?: PluginConfig;
protected profile?: PluginConfig;
protected proxy?: PluginConfig;
```

### Config methods (Fluent API)

| Method | Tham số | Mô tả |
|---|---|---|
| `useFingerprint(value, options?)` | string + object | Lưu fingerprint config |
| `useProfile(value, options?)` | string + object | Lưu profile path + options |
| `useProxy(value, options?)` | string + object | Lưu proxy URL + options |
| `useBrowserVersion(version)` | string | Version browser, mặc định 'default' |
| `setProxyFromArguments(args)` | string[] | Parse --proxy-server từ args |
| `setServiceKey(key)` | string | Lưu vào module-level serviceKey |

### Runtime methods

| Method | Mô tả |
|---|---|
| `fetch(options)` | Gọi api('fetch') -- lấy fingerprint |
| `versions(format)` | Gọi api('versions') -- danh sách version |
| `spawn(options)` | Gọi _launch(true, options) |
| `configure(cleanup, browser, bounds, sync)` | Gọi configure từ config.ts |

### _launch() flow chi tiết

```
1. setProxyFromArguments(options.args)
2. api('setup', { key, pid, fingerprint, proxy, profile, version })
   → response: { id, pid, pwd, path, bounds }
3. cleaner.watch(pwd).ignore(pwd, pid, id)
4. mutex.create('BASProcess' + pid)
5. Chọn launcher:
   - useDefaultLauncher=true → plugin launcher (spawn worker.exe)
   - useDefaultLauncher=false → options.launcher ?? this.launcher
6. Spawn với:
   - headless: false (force)
   - userDataDir: undefined
   - executablePath: path/worker.exe
   - args: --parent-process-id=pid, --unique-process-id=id
7. configure() → resize + sync .ini
8. Return browser/BrowserContext
```
