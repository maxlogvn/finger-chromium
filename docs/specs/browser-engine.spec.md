# Spec: BrowserEngine

## File: `src/adapter/playwright/chromium.ts` (228 dòng)

## Module-level

```ts
export const PRIVATE_KEY = process.env.BABLOSOFT_KEY ?? '';
export const BROWSER_RUNNING_DIR = path.join(process.cwd(), process.env.BROWSER_RUNNING_DIR ?? '.tmp/browser/running');
export const ENGINE_WORKING_DIR = path.join(process.cwd(), process.env.ENGINE_WORKING_DIR ?? '.tmp/browser/engine');
export const DEFAULT_CONTEXT_OPTIONS: PluginLaunchOptions = { headless: false, hasTouch: true };
```

---

## Class `BrowserEngine`

### Properties

| Property | Kiểu | Mô tả |
|---|---|---|
| `engine` | `PlaywrightFingerprintPlugin` | Plugin instance |
| `options` | `PluginLaunchOptions` | Merged launch options |
| `privateKey` | `string` | Từ env BABLOSOFT_KEY, mặc định `''` |
| `engineWorkingDirPath` | `string` | Từ env ENGINE_WORKING_DIR |
| `dataManager` | `AdapterDataManager` | Quản lý profile temp |
| `saveProfileDirPath` | `string \| undefined` | Path profile gốc user nhập |
| `profileData` | `[string, ProfileOptions?]` | `[tempPath, options]` |
| `context` | `BrowserContext \| undefined` | Runtime context |
| `fingerprints` | `[string, FingerprintOptions?] \| undefined` | Fingerprint data + options lưu tạm |
| `proxyData` | `[string, ProxyOptions?] \| undefined` | Proxy URL + options lưu tạm |
| `isLaunched` | `boolean` | Trạng thái launch |

### Constructor

```ts
constructor()
```

Tạo `PlaywrightFingerprintPlugin`, `AdapterDataManager`. Đọc env variables. Mặc định `profileData = [path.join(BROWSER_RUNNING_DIR, 'profile')]`.

### Public API (PWChromium)

| Method | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `repackChromium(launcher)` | `Launcher` | `this` | Tạo plugin mới với custom launcher |
| `useFingerprint(data, options?)` | `string`, `FingerprintOptions?` | `this` | Lưu fingerprint config |
| `useProxy(data, options?)` | `string`, `ProxyOptions?` | `this` | Lưu proxy config |
| `useProfile(dirPath, options?)` | `string`, `ProfileOptions?` | `this` | Map profile → temp, lưu config |
| `launch(options?)` | `Partial<PluginLaunchOptions>` | `this` | Khởi động engine (1 lần) |
| `newContext(options?)` | `Partial<PluginLaunchOptions>` | `Promise<BrowserContext>` | Tạo context |
| `newFingerprint(options?)` | `FetchOptions` | `Promise<string>` | Fetch fingerprint từ service |
| `quit(saveDataPath?)` | `string?` | `Promise<void>` | Dọn dẹp, lưu profile |

### Launch Flow

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `if (this.isLaunched) throw` | Chỉ 1 lần |
| 2 | `this.options = { ...this.options, ...options }` | Merge options |
| 3 | `this.engine.setServiceKey(this.privateKey)` | Set key |
| 4 | `this.engine.setWorkingFolder(this.engineWorkingDirPath)` | Set thư mục làm việc |
| 5 | `this.engine.useProfile(...this.profileData)` | Đăng ký profile |
| 6 | `if (this.proxyData) this.engine.useProxy(...)` | Đăng ký proxy nếu có |
| 7 | `if (this.fingerprints) this.engine.useFingerprint(...)` | Đăng ký fingerprint nếu có |
| 8 | `this.isLaunched = true` | Đánh dấu đã launch |

### NewContext Flow

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `if (!this.isLaunched) throw` | Phải launch trước |
| 2 | `if (this.context) throw` | Chỉ 1 context |
| 3 | `this.options = { ...this.options, ...options }` | Merge options |
| 4 | `this.context = await engine.launchPersistentContext(this.profileData[0], this.options)` | Tạo context |
| 5 | `return this.context` | Trả về BrowserContext |

### Quit Flow

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `if (!this.isLaunched) return` | No-op nếu chưa launch |
| 2 | `if (this.context)` | Nếu có context |
| 2a | `await this.context.close()` | Đóng context |
| 2b | `targetSavePath = saveDataPath ?? this.saveProfileDirPath` | Xác định đích |
| 2c | `if (targetSavePath) dataManager.map(this.profileData[0], targetSavePath)` | Copy temp → đích |
| 3 | `this.dataManager.unmap(BROWSER_RUNNING_DIR)` | Xoá temp profile |
| 4 | `this.isLaunched = false` | Reset trạng thái |

### Types Export

```ts
export type { ProfileOptions, FingerprintOptions, ProxyOptions, FetchOptions };

/** Options cho launchPersistentContext -- trích xuất từ kiểu Playwright. */
export type PluginLaunchOptions = Parameters<BrowserType['launchPersistentContext']>[1];

/** Launcher có thể tuỳ chỉnh -- cho phép dùng Playwright patch hoặc mặc định. */
export type Launcher = Pick<BrowserType, 'launch' | 'launchPersistentContext'>;
```

---

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Gọi `launch()` 2 lần | Throw `Error('[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan.')` |
| Gọi `newContext()` trước `launch()` | Throw `Error('[BrowserEngine] Phai goi launch() truoc khi tao context.')` |
| Gọi `newContext()` khi đã có context | Throw `Error('[BrowserEngine] Context da duoc tao. Vui long goi quit() truoc khi tao moi.')` |
| Gọi `quit()` khi chưa launch | No-op (kiểm tra `isLaunched`) |

---

## Kiểm tra

- `launch()` 2 lần -> throw Error.
- `quit()` nhiều lần -> không throw, lần 2 là no-op.
- Fluent chain: mỗi method trả về `this`.
- `repackChromium()` không reset config.
- Env fallback: `BABLOSOFT_KEY` không set -> `privateKey` là `''`.

---
