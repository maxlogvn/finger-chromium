# Plan: Playwright Bridge

## Các bước thực hiện

- [x] **Bước 1: Tạo PlaywrightFingerprintPlugin class kế thừa FingerprintPlugin** (file: `src/adapter/playwright/engine.ts`, dòng 41-47)

    **Signature:**
    ```ts
    export class PlaywrightFingerprintPlugin extends FingerprintPlugin {
      protected readonly pwLauncher: Launcher;
      constructor(launcher: Launcher = defaultLauncher);
    }
    ```

    **Logic chi tiết:**
    1. Import `defaultLoader` từ `./loader` — instance `Loader` với target `'playwright'`, minimum `'1.27.1'`, fallback `['playwright-core']`.
    2. Gọi `defaultLoader.load<'chromium'>('chromium')` để lấy `browserType: BrowserType`.
    3. Tạo `defaultLauncher`: `{ launch: browserType.launch.bind(browserType), launchPersistentContext: browserType.launchPersistentContext.bind(browserType) }` — bind context vì Playwright cần `this` là BrowserType.
    4. Constructor nhận `launcher` optional (mặc định defaultLauncher), gọi `super()` (FingerprintPlugin constructor không tham số).
    5. Gán `this.pwLauncher = launcher`.

    **Constants (dòng 19-27):**
    ```ts
    export const IGNORED_ARGUMENTS = ['--disable-extensions'];
    export const UNSUPPORTED_OPTIONS = ['proxy', 'channel', 'firefoxUserPrefs'] as const;
    export const LAUNCH_FALLBACK_WARNING = '[Fingerprint] ...';
    ```

    **Edge cases:**
    - Playwright chưa cài → `defaultLoader.load()` throw Error ngay khi import module (fail fast).
    - Playwright version < 1.27.1 → throw Error "Version X is not supported".
    - `launcher` custom không có `launch` hoặc `launchPersistentContext` → runtime error khi gọi.
    - `defaultLoader.import()` thử `['playwright', 'playwright-core']` — fallback nếu chỉ có core.

    **Tại sao:** `defaultLoader` dùng `createRequire` (ESM-compatible) để dynamic require playwright-core, tránh hard peer dependency. Bind context cần thiết vì Playwright methods dùng `this.internal`.

- [x] **Bước 2: Override launch() — fallback sang launchPersistentContext** (file: `src/adapter/playwright/engine.ts`, dòng 52-56)

    **Signature:**
    ```ts
    async launch(options: PluginLaunchOptions = {}): Promise<BrowserContext>
    ```

    **Logic chi tiết:**
    1. Gọi `this.#validateOptions(options)` — kiểm tra unsupported options.
    2. Gọi `console.warn(LAUNCH_FALLBACK_WARNING)` — in warning.
    3. Gọi `return this.launchPersistentContext('', options)` — fallback với userDataDir rỗng.

    **Edge cases:**
    - `options` chứa `proxy` → `#validateOptions` throw Error "Option 'proxy' không được hỗ trợ".
    - `options` chứa `channel` → throw Error.
    - `options` chứa `firefoxUserPrefs` → throw Error.
    - `launch()` được gọi → luôn fallback, không có cách nào dùng launch thuần.

    **Tại sao:** `launch()` standalone không có persistent profile nên fingerprint injection (cần profile) không hoạt động đầy đủ. Fallback đảm bảo không crash, nhưng user nên dùng `launchPersistentContext` trực tiếp.

- [x] **Bước 3: Override launchPersistentContext() — inject fingerprint qua launcher proxy** (file: `src/adapter/playwright/engine.ts`, dòng 62-82)

    **Signature:**
    ```ts
    async launchPersistentContext(userDataDir: string, options: PluginLaunchOptions = {}): Promise<BrowserContext>
    ```

    **Logic chi tiết (6 bước con):**
    1. **Validate:** `this.#validateOptions(options)` — throw nếu có unsupported option.
    2. **Extract:** `const { ignoreDefaultArgs } = options`.
    3. **Kiểm tra method:** `if (!this.pwLauncher[method]) throw new Error(...)` — method launchPersistentContext phải tồn tại.
    4. **Tạo launcher proxy:** object với `launch` function ảo — nhận opts:
       - Filter args: `(opts.args ?? []).filter(arg => !arg.startsWith('--user-data-dir'))` — xoá `--user-data-dir` vì engine tự quản lý.
       - Gọi `this.pwLauncher[method](userDataDir, { ...opts, args: filteredArgs })` — delegate thật.
    5. **Build options gửi xuống _launch():**
       ```ts
       {
         ...options,
         userDataDir,
         viewport: null,           // fingerprint tự resize
         launcher: { launch: ... } as any,  // proxy
         ignoreDefaultArgs: Array.isArray(ignoreDefaultArgs)
           ? ignoreDefaultArgs.concat(IGNORED_ARGUMENTS)
           : ignoreDefaultArgs || IGNORED_ARGUMENTS,
       }
       ```
    6. **Gọi `_launch(false, options)`** — `false` = useDefaultLauncher = không dùng spawn, dùng launcher proxy.
    7. Return `Promise<BrowserContext>` — cast từ return type của `_launch` (Browser).

    **Edge cases:**
    - `ignoreDefaultArgs` là array → concat với IGNORED_ARGUMENTS (không mutate array gốc).
    - `ignoreDefaultArgs` là truthy nhưng không array → dùng IGNORED_ARGUMENTS.
    - `ignoreDefaultArgs` là falsy → dùng IGNORED_ARGUMENTS.
    - Launcher proxy filter `--user-data-dir=...` — loại bỏ mọi arg bắt đầu bằng prefix.
    - `userDataDir` là '' → engine dùng default profile path.

    **Tại sao:** Filter `--user-data-dir` vì engine tự quản lý profile qua temp dir mapping. `viewport: null` vì fingerprint inject resize viewport riêng — Playwright set viewport trước sẽ conflict với fingerprint. `--disable-extensions` tránh extension modify DOM/navigator gây nhiễu fingerprint check.

- [x] **Bước 4: Implement configure() — cấu hình context sau spawn** (file: `src/adapter/playwright/engine.ts`, dòng 87-104)

    **Signature:**
    ```ts
    async configure(
      cleanup: (target: any) => void,
      browser: any,
      bounds: { width: number; height: number },
      sync: (fn: () => Promise<void>) => Promise<void>
    ): Promise<void>
    ```

    **Logic chi tiết (5 bước con):**
    1. **Cast:** `const context = browser as BrowserContext`.
    2. **Cleanup handler:** `onClose(context, () => cleanup(context))` — đăng ký handler khi context đóng (event 'close').
    3. **Resize function (nếu bounds hợp lệ):**
       ```ts
       const resize = async (page: Page) => {
         const { width, height } = await getViewport(page);
         if (width !== bounds.width || height !== bounds.height)
           await sync(() => setViewport(page, bounds));
       };
       ```
       - `getViewport(page)` gọi `page.evaluate(scripts.getViewport)` — lấy innerWidth/innerHeight.
       - Chỉ resize nếu kích thước hiện tại ≠ bounds — tránh resize không cần thiết.
       - `sync()` wrapper dùng AsyncLock — tránh race condition khi resize nhiều page cùng lúc.
    4. **Bind hooks:** `bindHooks(context, { onPageCreated: resize })` — proxy newContext/newPage để resize mỗi page mới.
    5. **Resize page đầu:** `const [firstPage] = context.pages(); if (firstPage) await resize(firstPage)` — resize page đã mở sẵn.

    **Edge cases:**
    - `bounds.width` hoặc `bounds.height` = 0 → skip resize (không vào if).
    - Context không có page nào → firstPage undefined → skip resize.
    - `getViewport()` fail (page closed) → throw Error, caller catch.
    - `setViewport()` fail (CDP session lỗi) → throw Error.
    - `bindHooks()` đã được gọi → proxy `newContext`/`newPage` có thể bị wrap nhiều lần.

    **Tại sao:** `configure()` là override của method trong `FingerprintPlugin` — Playwright path dùng CDPSession (qua `page.newCDPSession()`), trong khi plugin path dùng `chrome-remote-interface` (qua port). `getViewport()` dùng `page.evaluate` thay vì Playwright API vì `page.viewportSize()` trả về giá trị set bởi Playwright, không phải kích thước thực sau khi resize CDP.

- [x] **Bước 5: #validateOptions + constants** (file: `src/adapter/playwright/engine.ts`, dòng 106-110)

    **Signature:**
    ```ts
    #validateOptions(options: Record<string, unknown> = {}): void
    ```

    **Logic chi tiết:**
    1. Loop `for (const option of UNSUPPORTED_OPTIONS) { if (option in options) throw new Error(...) }`.
    2. `UNSUPPORTED_OPTIONS = ['proxy', 'channel', 'firefoxUserPrefs']` — array const, readonly.
    3. Error message: `Option "${option}" không được hỗ trợ trong plugin này.`

    **Edge cases:**
    - `options` là null/undefined → default `{}` → loop không chạy, không throw.
    - `options.proxy = null` → `'proxy' in options` là true → throw (null vẫn là key tồn tại).
    - `options.channel = undefined` → `'channel' in options` là false → không throw (undefined key không tồn tại).

    **Tại sao:** Proxy không được hỗ trợ trong Playwright options vì engine native xử lý proxy ở tầng C/C++ (WebRTC, DNS, tunneling). `channel` (msedge, chrome-beta) và `firefoxUserPrefs` không liên quan đến Chromium fingerprint. Dùng `in` operator thay vì `hasOwnProperty` vì muốn bắt cả inherited properties.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup build
```

## Ghi chú

- Load Playwright module từ `defaultLoader` (hỗ trợ `>= 1.27.1`). Nếu không tìm thấy, throw Error.
- `launch()` chỉ là fallback — khuyến nghị dùng `launchPersistentContext()`.
- `configure()` override từ `FingerprintPlugin.configure()` — Playwright path dùng CDPSession, khác với plugin path dùng chrome-remote-interface.
- `bindHooks` proxy `newContext`/`newPage`/`setViewportSize` — xem hook-binding plan chi tiết.
- Filter args: `--user-data-dir` bị loại bỏ để tránh xung đột profile path.
