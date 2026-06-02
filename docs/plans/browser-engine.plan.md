# Plan: BrowserEngine

## Các bước thực hiện

- [x] **Bước 1: Tạo BrowserEngine class implement PWChromium** (file: `src/adapter/playwright/chromium.ts`, dòng 55-79)

    **Signatures:**
    ```ts
    class BrowserEngine implements PWChromium {
      readonly engine: PlaywrightFingerprintPlugin;
      private options: PluginLaunchOptions;
      private privateKey: string;
      private readonly engineWorkingDirPath: string;
      private readonly dataManager: AdapterDataManager;
      private saveProfileDirPath?: string;
      private profileData: [string, ProfileOptions?];
      private context?: BrowserContext;
      private isLaunched = false;
      private fingerprints?: [string, FingerprintOptions?];
      private proxyData?: [string, ProxyOptions?];
    }
    ```

    **Logic chi tiết:**
    1. Constructor gán `this.engine = new PlaywrightFingerprintPlugin()` — tạo engine fingerprint với launcher mặc định.
    2. Gán `this.options = { ...DEFAULT_CONTEXT_OPTIONS }` — clone object thay vì gán tham chiếu, tránh mutate global mặc định.
    3. Gán `this.privateKey = PRIVATE_KEY` — lấy từ `process.env.BABLOSOFT_KEY ?? ''`.
    4. Gán `this.engineWorkingDirPath = ENGINE_WORKING_DIR` — path tĩnh, không thay đổi sau này.
    5. Gán `this.dataManager = new AdapterDataManager()` — singleton data manager cho profile.
    6. Gán `this.profileData = [path.join(BROWSER_RUNNING_DIR, 'profile')]` — default profile path.
    7. Các field còn lại: `context = undefined`, `isLaunched = false`, `fingerprints = undefined`, `proxyData = undefined`.

    **Constants (dòng 34-47):**
    ```ts
    export const PRIVATE_KEY = process.env.BABLOSOFT_KEY ?? '';
    export const BROWSER_RUNNING_DIR = path.join(process.cwd(), process.env.BROWSER_RUNNING_DIR ?? '.tmp/browser/running');
    export const ENGINE_WORKING_DIR = path.join(process.cwd(), process.env.ENGINE_WORKING_DIR ?? '.tmp/browser/engine');
    export const DEFAULT_CONTEXT_OPTIONS: PluginLaunchOptions = { headless: false, hasTouch: true };
    ```

    **Edge cases:**
    - `BABLOSOFT_KEY` không set → `PRIVATE_KEY = ''` → engine API gọi sẽ fail với MissingKeyError.
    - `BROWSER_RUNNING_DIR` không set → fallback `.tmp/browser/running` trong CWD.
    - `ENGINE_WORKING_DIR` không set → fallback `.tmp/browser/engine` trong CWD.
    - `AdapterDataManager` constructor tự tạo instanceTempDir — nếu fail (permission error), throw ngay constructor.

    **Tại sao:** Dùng interface `PWChromium` để tách biệt contract và implementation — có thể mock trong test. `headless: false` vì fingerprint check (WebGL, canvas) phát hiện headless mode ngay cả khi dùng `--headless=new`.

- [x] **Bước 2: Fluent config methods — useFingerprint, useProxy, useProfile, repackChromium** (file: `src/adapter/playwright/chromium.ts`, dòng 82-127)

    **Signatures:**
    ```ts
    repackChromium(launcher: Launcher): this
    useFingerprint(data: string, options?: FingerprintOptions): this
    useProxy(data: string, options?: ProxyOptions): this
    useProfile(dirPath: string, options?: ProfileOptions): this
    ```

    **Logic chi tiết từng method:**
    1. **repackChromium:** `this.engine = new PlaywrightFingerprintPlugin(launcher)` — tạo engine mới với launcher custom, return `this`.
    2. **useFingerprint:** `this.fingerprints = [data, options]` — lưu tuple, validation ở plugin layer.
    3. **useProxy:** `this.proxyData = [data, options]` — lưu tuple, validation ở plugin layer.
    4. **useProfile:**
       - `this.saveProfileDirPath = dirPath` — lưu để dùng trong quit().
       - `this.profileData = [this.dataManager.map(dirPath), options]` — `dataManager.map()` copy profile vào temp dir NGAY LÚC NÀY, trả về temp path.
       - Nếu profile không tồn tại, `dataManager.map()` throw Error → fail sớm, không đợi launch.

    **Edge cases:**
    - Gọi `useProfile()` với path không tồn tại → `fs.cpSync` throw → Error với message chi tiết path.
    - Gọi `repackChromium()` sau khi gọi useFingerprint/useProxy/useProfile → engine mới không có config cũ → cần gọi config lại.
    - Gọi `useFingerprint()` với data = '' → validate fail ở plugin (throw).
    - Gọi `useProfile()` nhiều lần → mỗi lần tạo temp dir mới, profileData là tuple mới nhất.
    - Gọi config methods sau `launch()` → không throw nhưng cũng không có hiệu lực (không relay xuống engine).

    **Tại sao:** Fluent API (`return this`) cho phép chain: `.useFingerprint(fp).useProxy(url).useProfile(dir).launch()`. `dataManager.map()` gọi ở `useProfile()` thay vì `launch()` để fail sớm — profile sai được phát hiện ngay khi config, không đợi launch. Tuple `[data, options]` dùng spread để relay xuống plugin vì signature giống hệt.

- [x] **Bước 3: launch() — guard + merge options + cấu hình engine** (file: `src/adapter/playwright/chromium.ts`, dòng 130-153)

    **Signature:**
    ```ts
    launch(options: Partial<PluginLaunchOptions> = {}): this
    ```

    **Logic chi tiết (4 bước con):**
    1. **Guard:** `if (this.isLaunched)` throw `new Error('[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan.')`.
    2. **Merge options:** `this.options = { ...this.options, ...options }` — thứ tự ưu tiên: DEFAULT_CONTEXT_OPTIONS (low) < config từ setter (trung) < options truyền vào launch (cao). Dùng spread operator, override key trùng.
    3. **Cấu hình engine:**
       - `this.engine.setServiceKey(this.privateKey)` — gán key (có thể là '' nếu BABLOSOFT_KEY không set).
       - `this.engine.setWorkingFolder(this.engineWorkingDirPath)` — set CWD cho RemoteEngine.
       - `this.engine.useProfile(...this.profileData)` — relay profile tuple xuống plugin.
    4. **Đăng ký proxy/fingerprint (conditional):**
       - `if (this.proxyData) this.engine.useProxy(...this.proxyData)`
       - `if (this.fingerprints) this.engine.useFingerprint(...this.fingerprints)`
    5. Set `this.isLaunched = true`, return `this`.

    **Edge cases:**
    - Gọi `launch()` 2 lần → throw Error ngay bước 1, không có side effect.
    - `privateKey = ''` → engine API 'setup' fail với MissingKeyError khi newContext().
    - Chưa gọi `useProfile()` → `profileData` là default `[BROWSER_RUNNING_DIR/profile]`.
    - Chưa gọi `useFingerprint()` → `fingerprints = undefined` → bỏ qua.
    - `options` truyền vào spread đè lên `DEFAULT_CONTEXT_OPTIONS` — nếu truyền `{ headless: true }`, nó sẽ override nhưng engine sẽ force `headless: false` ở tầng _launch().

    **Tại sao:** Guard `isLaunched` đảm bảo engine state là deterministic — nếu launch 2 lần, engine process conflict. Merge options 3 lớp cho phép default an toàn, config có thể override, launch options override cuối cùng.

- [x] **Bước 4: newContext() + newFingerprint()** (file: `src/adapter/playwright/chromium.ts`, dòng 162-183)

    **Signatures:**
    ```ts
    async newContext(options: Partial<PluginLaunchOptions> = {}): Promise<BrowserContext>
    async newFingerprint(options: FetchOptions | undefined): Promise<string>
    ```

    **Logic chi tiết newContext():**
    1. **Guard chưa launch:** `if (!this.isLaunched)` throw `new Error('[BrowserEngine] Phai goi launch() truoc khi tao context.')`.
    2. **Guard context đã tồn tại:** `if (this.context)` throw `new Error('[BrowserEngine] Context da duoc tao. Vui long goi quit() truoc khi tao moi.')`.
    3. **Merge options lần cuối:** `this.options = { ...this.options, ...options }`.
    4. **Launch persistent context:**
       - `this.context = await this.engine.launchPersistentContext(this.profileData[0], this.options)`
       - `this.profileData[0]` là temp profile path (đã được map từ useProfile hoặc default).
       - `this.options` là PluginLaunchOptions đã merged (viewport, headless, args...).
    5. Return `this.context`.

    **Logic chi tiết newFingerprint():**
    1. `return await this.engine.fetch(options)` — gọi API 'fetch' qua connector.
    2. Không cần guard — có thể gọi bất cứ lúc nào, không phụ thuộc launch state.
    3. Return JSON string fingerprint từ bablosoft service.

    **Edge cases:**
    - Gọi `newContext()` trước `launch()` → throw Error.
    - Gọi `newContext()` 2 lần mà chưa quit → throw Error.
    - Gọi `newContext()` sau khi quit → OK (isLaunched = false → throw chưa launch).
    - `newFingerprint()` không cần launch — có thể gọi để lấy fingerprint trước.
    - `FetchOptions` có thể undefined → engine dùng default filter.

    **Tại sao:** Guard context double-create tránh memory leak và profile conflict. Chỉ một context vì mỗi context là một profile riêng — tạo context mới với profile mới sẽ ghi đè temp dir. `newFingerprint()` độc lập với lifecycle cho phép lấy fingerprint sớm.

- [x] **Bước 5: quit() — close context, save profile, cleanup engine** (file: `src/adapter/playwright/chromium.ts`, dòng 191-212)

    **Signature:**
    ```ts
    async quit(saveDataPath?: string): Promise<void>
    ```

    **Logic chi tiết (4 bước con):**
    1. **Guard:** `if (!this.isLaunched) return` — an toàn khi gọi nhiều lần, không throw.
    2. **Set flag:** `this.isLaunched = false` — ngay đầu để tránh race condition.
    3. **Close context + save profile** (chỉ nếu context tồn tại):
       - `await this.context.close()` — Playwright close context (đóng pages, release ports).
       - `this.context = undefined` — clear reference.
       - `const targetSavePath = saveDataPath ?? this.saveProfileDirPath` — ưu tiên param, fallback config.
       - `if (targetSavePath) this.dataManager.map(this.profileData[0], targetSavePath)` — copy temp → destination.
    4. **Cleanup engine:** `await this.engine.cleanup()` — kill worker.exe, engine process, PCAP server, cleaner stop, mutex release.
    5. **Unmap temp:** `this.dataManager.unmap(BROWSER_RUNNING_DIR)` — xoá thư mục tạm.

    **Edge cases:**
    - Gọi `quit()` nhiều lần → lần 2 guard return ngay, không lỗi.
    - Gọi `quit()` trước `newContext()` → context undefined, bỏ qua save profile, chỉ cleanup engine + unmap.
    - `saveDataPath` truyền vào ≠ `saveProfileDirPath` → profile được copy sang path mới.
    - `this.dataManager.map()` fail (disk full, permission) → throw Error, quit() không catch → caller nhận lỗi.
    - `this.engine.cleanup()` fail → throw Error, `dataManager.unmap()` không được gọi → temp dir tồn đọng.
    - Profile chưa từng được lưu (userDataDir mới tạo) → copy directory rỗng.

    **Tại sao:** Set `isLaunched = false` ngay đầu để nếu cleanup throw, quit() vẫn không chạy lại lần 2. `saveDataPath` parameter cho phép snapshot profile — hữu ích khi muốn backup trạng thái trước khi đóng.

- [x] **Bước 6: Export Chromium singleton + constants + types** (file: `src/adapter/playwright/chromium.ts`, dòng 217-231)

    **Exports:**
    ```ts
    const Chromium: PWChromium = new BrowserEngine();
    export { Chromium };
    ```

    **Logic chi tiết:**
    1. `const Chromium: PWChromium = new BrowserEngine()` — instance singleton, typed as interface.
    2. Export kèm constants: `PRIVATE_KEY`, `BROWSER_RUNNING_DIR`, `ENGINE_WORKING_DIR`, `DEFAULT_CONTEXT_OPTIONS`.
    3. Export types: `PluginLaunchOptions`, `Launcher`, `ProfileOptions`, `FingerprintOptions`, `ProxyOptions`, `FetchOptions` (re-export từ file khác).
    4. `src/index.ts` re-export `Chromium` và các type này.

    **Edge cases:**
    - User import `Chromium` và gọi config methods → singleton state bị mutate global.
    - Nếu user cần multiple engine instances, phải tạo `new BrowserEngine()` thủ công.
    - Constants export để user có thể đọc/ghi đè (vd: `PRIVATE_KEY` là read-only export).

    **Tại sao:** Singleton pattern giảm phức tạp cho use case phổ biến (một engine). Interface typing `PWChromium` cho phép user code phụ thuộc vào contract, không vào implementation — dễ mock và test.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup build (ESM + CJS + DTS)
```

- **Lint:** 0 errors mong đợi, 16 warnings pre-existing về `no-explicit-any`.
- **Build:** Output gồm `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.d.cts`.

## Ghi chú

- `usePrivateKey()` không tồn tại trong code — key được lấy từ biến môi trường `BABLOSOFT_KEY` qua constant `PRIVATE_KEY`.
- `saveDataPath` trong `quit()` cho phép ghi đè save path mà không ảnh hưởng đến `saveProfileDirPath` gốc.
- `isLaunched` guard đảm bảo lifecycle bắt buộc: launch → newContext → quit.
- `DEFAULT_CONTEXT_OPTIONS` dùng spread để clone — không mutate object gốc.
- `repackChromium()` tạo engine mới — config cũ (fingerprint, proxy, profile) không được migrate.
