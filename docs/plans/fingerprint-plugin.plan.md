# Plan: FingerprintPlugin

## Các bước thực hiện

- [x] **Bước 1: Tạo FingerprintPlugin class với constructor và static create()** (file: `src/plugin/index.ts`, dòng 69-93)

    **Signatures:**
    ```ts
    export default class FingerprintPlugin {
      protected launcher: { launch: (opts: BaseLaunchOptions) => Promise<Browser> };
      protected version: string | null = 'default';
      protected fingerprint?: PluginConfig;
      protected profile?: PluginConfig;
      protected proxy?: PluginConfig;
      protected browser?: Browser;
      protected processId?: string;

      constructor(launcherInstance?: { launch: (opts: BaseLaunchOptions) => Promise<Browser> });
      static create(launcherInstance: { launch: (opts: BaseLaunchOptions) => Promise<Browser> }): FingerprintPlugin;
    }
    ```

    **Types hỗ trợ (dòng 28-57):**
    ```ts
    interface SetupResponse { id: string; pid: string; pwd: string; path: string; bounds: ViewportBounds; [key: string]: unknown; }
    interface PluginConfig { value: string; options: FingerprintOptions | ProfileOptions | ProxyOptions; }
    interface BaseLaunchOptions extends SpawnOptions { launcher?: {...}; key?: string; defaultViewport?: {...} | null; [key: string]: unknown; }
    ```

    **Logic chi tiết:**
    1. **Constructor:** Nếu `launcherInstance` không có, dùng `{ launch }` từ module launcher (spawn Chromium process). Nếu có, dùng trực tiếp.
    2. **Static create:** Gọi `validateLauncher(launcherInstance)` — kiểm tra launcher có method `launch` là function. Nếu không, throw Error.
    3. Fields: `version = 'default'` (engine chọn version mới nhất), còn lại undefined.

    **Edge cases:**
    - `create()` với launcher không có `launch` → throw Error.
    - Constructor không throw — dùng cho singleton mặc định.
    - Launcher từ module `launch` là hàm spawn Chromium — khác với Playwright launcher (dùng launchPersistentContext).

    **Tại sao:** `create()` dùng factory pattern cho phép validate launcher trước khi tạo instance — fail sớm, tránh runtime error sau này. Constructor không throw để singleton có thể khởi tạo an toàn.

- [x] **Bước 2: Fluent config methods — useFingerprint, useProxy, useProfile, useBrowserVersion** (file: `src/plugin/index.ts`, dòng 101-161)

    **Signatures:**
    ```ts
    useFingerprint(value = '', options: FingerprintOptions = {}): this
    useProfile(value = '', options: ProfileOptions = {}): this
    useProxy(value = '', options: ProxyOptions = {}): this
    useBrowserVersion(version: string): this
    setProxyFromArguments(args: string[] = []): this
    setWorkingFolder(folder: string): void
    setRequestTimeout(timeout: number): void
    setEngineTimeout(timeout: number): void
    setServiceKey(key: string): void
    ```

    **Logic chi tiết từng method:**
    1. **useFingerprint:** `validateConfig('fingerprint', value, options)` → kiểm tra value là string length > 0, options là object. Lưu `this.fingerprint = { value, options }`.
    2. **useProxy:** Tương tự, lưu `this.proxy = { value, options }`.
    3. **useProfile:** Tương tự, lưu `this.profile = { value, options }`.
    4. **useBrowserVersion:** `this.version = version || 'default'` — nếu falsy, dùng 'default'.
    5. **setProxyFromArguments:**
       - `if (this.proxy == null)` — chỉ fallback nếu chưa gọi useProxy.
       - Duyệt `for (const arg of args) if (arg.includes('--proxy-server')) return this.useProxy(arg.slice(15))`.
       - `arg.slice(15)` bỏ prefix `--proxy-server=` — lấy URL proxy.
    6. **setWorkingFolder:** `engine.setCwd(path.resolve(folder))` — relay xuống RemoteEngine.
    7. **setRequestTimeout:** `engine.setRequestTimeout(timeout || 0)` — 0 = không timeout.
    8. **setEngineTimeout:** `engine.setEngineTimeout(timeout || 0)`.
    9. **setServiceKey:** Gán module-level `serviceKey = key`.

    **Edge cases:**
    - `value = ''` → `validateConfig` throw Error (string rỗng).
    - `options` không phải object → `validateConfig` throw Error.
    - `setProxyFromArguments` không tìm thấy `--proxy-server` → return this (no-op).
    - `useBrowserVersion('')` → version = 'default'.
    - `setRequestTimeout(0)` → timeout = 0 (không timeout).

    **Tại sao:** `validateConfig()` dùng chung cho fingerprint/proxy/profile — DRY. `setProxyFromArguments` fallback cần thiết khi launch từ Playwright có proxy option — User có thể set proxy qua `launch({ proxy: {...} })` mà không gọi `useProxy`. `serviceKey` là module-level vì API connector singleton (engine) dùng chung key cho mọi instance.

- [x] **Bước 3: fetch() + versions()** (file: `src/plugin/index.ts`, dòng 198-216)

    **Signatures:**
    ```ts
    async fetch(options: FetchOptions = {}): Promise<string>
    async versions<T extends 'default' | 'extended' = 'default'>(format: T = 'default' as T): Promise<T extends 'extended' ? Version[] : string[]>
    ```

    **Logic chi tiết:**
    1. **fetch:** Gọi `api('fetch', { key: serviceKey, options, version: this.version })` — gửi key, filter options, và browser version. Return response cast thành string.
    2. **versions:** Gọi `api('versions', { format })` — format 'default' trả về string[] (tên version), 'extended' trả về Version[] (từ chrome-remote-interface — có version, revision, etc.).

    **Edge cases:**
    - `serviceKey` là undefined → engine throw MissingKeyError (qua error normalization).
    - `FetchOptions` rỗng → lấy fingerprint bất kỳ (không filter).
    - `versions('extended')` trả về array objects với `{ version, revision, ... }`.
    - Cả fetch và versions đều có thể gọi trước khi launch — engine tự start nếu chưa chạy.

    **Tại sao:** fetch/versions không phụ thuộc launch state — có thể gọi để lấy fingerprint trước khi khởi động browser. Response cast thành string vì engine luôn trả về JSON string cho fetch.

- [x] **Bước 4: _launch() — spawn worker.exe với fingerprint/proxy/profile** (file: `src/plugin/index.ts`, dòng 234-277)

    **Signature:**
    ```ts
    protected async _launch(useDefaultLauncher: boolean, options: BaseLaunchOptions = {}): Promise<Browser>
    ```

    **Logic chi tiết (6 bước):**
    1. **setProxyFromArguments:** `this.setProxyFromArguments(options.args || [])` — fallback proxy từ CLI args nếu useProxy chưa gọi.

    2. **api('setup'):** Gọi với payload:
       ```ts
       {
         proxy: this.proxy,
         fingerprint: this.fingerprint,
         version: this.version,
         profile: this.profile ?? { value: getProfilePath(options), options: { loadProxy: true, loadFingerprint: true } },
         pid: crypto.randomUUID(),
         key: typeof options.key === 'string' ? options.key : serviceKey,
       }
       ```
       Engine response: `{ id, pid, pwd, path, bounds, ...config }`.
       - `id`: unique process ID (engine sinh ra).
       - `pid`: process ID (dùng cho cleaner lock).
       - `pwd`: working directory (của engine worker).
       - `path`: path đến worker.exe binary.
       - `bounds`: viewport bounds từ fingerprint.
       - Gán `this.processId = pid`.

    3. **Cleaner + Mutex:**
       ```ts
       await cleaner.watch(pwd).ignore(pwd, pid, id);
       mutex.create(`BASProcess${pid}`);
       ```
       - `watch`: đăng ký thư mục cần cleanup.
       - `ignore`: lock file để không bị xoá khi process đang chạy.
       - `mutex.create`: tạo Windows named mutex cho BASProcess.

    4. **Chọn launcher:**
       ```ts
       const activeLauncher = useDefaultLauncher
         ? { launch }  // spawn worker.exe (plugin path)
         : (options.launcher ?? this.launcher);  // launcher proxy từ Playwright bridge
       ```

    5. **Spawn worker.exe:**
       ```ts
       const browser = await activeLauncher.launch({
         ...options,
         headless: false,
         userDataDir: undefined,
         defaultViewport: undefined,
         executablePath: `${browserPath}/worker.exe`,
         args: [`--parent-process-id=${pid}`, `--unique-process-id=${id}`, ...defaultArgs({ ...options, ...config })],
       });
       ```
       Gán `this.browser = browser`.

    6. **Configure + synchronize:**
       ```ts
       const configFn = useDefaultLauncher ? configure : this.configure.bind(this);
       await configFn(() => cleaner.include(pwd, pid, id), browser, bounds, synchronize.bind(null, id, pwd, bounds));
       ```
       - `configure()` gọi cleanup handler, resize viewport.
       - `synchronize()` update availWidth/availHeight vào .ini file.
       - `cleaner.include()` unlock file sau khi process đã dùng xong.

    **Edge cases:**
    - `options.key` là string → dùng làm key (có thể override serviceKey).
    - `this.profile` undefined → fallback `getProfilePath(options)` — trích xuất từ `--user-data-dir`.
    - `options.args` không có array → `[]` mặc định.
    - `defaultArgs()` sinh arguments cho worker.exe — bao gồm args từ config (proxy, fingerprint).
    - `bounds` từ engine có thể undefined → viewport resize skip.

    **Tại sao:** `_launch` protected để subclass (PlaywrightFingerprintPlugin) có thể override `configure()`. Hai path: plugin path dùng `configure` (chrome-remote-interface) và Playwright path dùng `this.configure` (CDPSession). `headless: false` force vì fingerprint check phát hiện headless.

- [x] **Bước 5: Implement cleanup() — dọn dẹp tài nguyên** (file: `src/plugin/index.ts`, dòng 283-293)

    **Signature:**
    ```ts
    async cleanup(): Promise<void>
    ```

    **Logic chi tiết (4 bước, thứ tự quan trọng):**
    1. **Close browser:** `if (this.browser) { await this.browser.close().catch(() => {}); this.browser = undefined; }` — kill worker.exe.
    2. **Connector cleanup:** `await connectorCleanup()` — gọi `engine.kill()` (kill FastExecuteScript.exe) + `pcapServer.close()` (close TCP socket).
    3. **Release mutex:** `if (this.processId) { mutex.release(`BASProcess${this.processId}`); }` — giải phóng Windows named mutex.
    4. **Cleaner stop:** `await cleaner.stop()` — clear interval, unlock files, clear folders.

    **Edge cases:**
    - `this.browser.close()` fail (process đã chết) → `.catch(() => {})` — ignore.
    - `this.browser` undefined (chưa spawn) → skip.
    - `this.processId` undefined (chưa setup) → skip mutex release.
    - `cleaner.stop()` gọi unlock toàn bộ file còn locked — catch error silently.
    - Gọi `cleanup()` nhiều lần → lần 2: browser undefined (đã set), connectorCleanup an toàn (engine.kill check killed), mutex release skip, cleaner.stop an toàn (folders rỗng).

    **Tại sao:** Thứ tự strict: worker.exe trước (cần tắt để giải phóng port, file handle), engine process sau (PCAP server), cleaner cuối (xoá file tạm sau khi mọi process đã đóng). `.catch(() => {})` trên browser.close vì nếu process đã chết, không cần throw.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup build (ESM + CJS + DTS)
```

## Ghi chú

- `plugin` singleton export dùng cho Playwright bridge — mặc định launcher spawn worker.exe.
- `_launch()` protected — subclass override `configure()` để dùng CDPSession thay chrome-remote-interface.
- Event handlers (`beforeDownload`, `beforeExtract`) relay từ `engine` (RemoteEngine) — đăng ký qua `engine.on()`.
- `$SVC_KEY$` trong defaultArgs được thay thế bằng serviceKey — engine native đọc key từ command line.
- `headless: false` force trong _launch — không thể override, fingerprint check detect headless.
