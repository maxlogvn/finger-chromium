# Spec: BrowserEngine

## Class: BrowserEngine (228 dòng)

### Properties

| Property | Type | Mô tả |
|---|---|---|
| `engine` | `PlaywrightFingerprintPlugin` | Plugin instance |
| `options` | `PluginLaunchOptions` | Merged launch options |
| `privateKey` | `string` | Từ env BABLOSOFT_KEY |
| `engineWorkingDirPath` | `string` | Từ env ENGINE_WORKING_DIR |
| `dataManager` | `AdapterDataManager` | Quản lý profile temp |
| `saveProfileDirPath` | `string?` | User's original profile path |
| `context` | `BrowserContext?` | Runtime context |
| `isLaunched` | `boolean` | Trạng thái launch |

### Public API (PWChromium)

| Method | Mô tả |
|---|---|
| `repackChromium(launcher): this` | Thay launcher, tạo plugin mới |
| `useFingerprint(data, options): this` | Lưu fingerprint config |
| `useProxy(data, options): this` | Lưu proxy config |
| `useProfile(dirPath, options): this` | Map profile → temp, lưu config |
| `newFingerprint(options): Promise<string>` | Fetch fingerprint từ service |
| `launch(options): this` | Khởi động engine (1 lần) |
| `newContext(options): Promise<BrowserContext>` | Tạo context |
| `quit(saveDataPath?): Promise<void>` | Dọn dẹp, lưu profile |

### launch() flow

```
1. Throw if isLaunched
2. Merge options: DEFAULT_CONTEXT_OPTIONS < this.options < options
3. engine.setServiceKey(key)
4. engine.setWorkingFolder(engineWorkingDirPath)
5. engine.useProfile(tempDirPath, profileOptions)
6. engine.useProxy(proxyUrl, proxyOptions) [nếu có]
7. engine.useFingerprint(fp, fpOptions) [nếu có]
8. isLaunched = true
```

### newContext() flow

```
1. Throw if !isLaunched
2. Throw if context exists
3. Merge options: DEFAULT_CONTEXT_OPTIONS < this.options < options
4. context = await engine.launchPersistentContext(profilePath, options)
5. Return context
```

### quit() flow

```
1. if !isLaunched → return
2. await context.close()
3. if saveProfileDirPath:
   dataManager.map(tempDirPath, saveDataPath ?? saveProfileDirPath)
4. dataManager.unmap(BROWSER_RUNNING_DIR)
5. isLaunched = false
```
