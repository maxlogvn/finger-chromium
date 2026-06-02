# Plan: Quản lý Viewport

## Các bước thực hiện

- [x] **Bước 1: Implement setViewport() dùng chrome-remote-interface (plugin path)** (file: `src/plugin/browser.ts`, dòng 49-69)

    **Signature:**
    ```ts
    export const setViewport = async (
      browser: Browser,
      { diff, width, height }: SetViewportOptions
    ): Promise<void>
    ```

    **Constants:** `export const MAX_RESIZE_RETRIES = 3;`

    **Logic chi tiết:**
    ```ts
    const cdp = await connect(browser);  // CDP connection qua port
    const { windowId } = await cdp.Browser.getWindowForTarget();
    const delta = diff ? { ...diff } : { width: 16, height: 88 };

    for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
      const bounds = { width: width + delta.width, height: height + delta.height };
      await Promise.all([
        cdp.Browser.setWindowBounds({ bounds, windowId }),
        waitForResize(cdp)  // CDP Runtime.evaluate(scripts.waitForResize)
      ]);
      const viewport = await getViewport(cdp);  // CDP Runtime.evaluate(scripts.getViewport)
      if (width === viewport.width && height === viewport.height) break;
      if (i === MAX_RESIZE_RETRIES - 1) console.warn('Không thể đặt kích thước viewport chính xác.');
      delta.height += height - viewport.height;
      delta.width += width - viewport.width;
    }
    await cdp.close();
    ```

    **Helper functions (dòng 74-88):**
    ```ts
    export const getViewport = async (cdp: Client): Promise<ViewportBounds> => {
      const { result } = await cdp.Runtime.evaluate({
        expression: `(${scripts.getViewport})()`,
        returnByValue: true,
      }) as RuntimeEvaluateResult<ViewportBounds>;
      return result.value;
    };
    const waitForResize = async (cdp: Client): Promise<void> => {
      await cdp.Runtime.evaluate({
        expression: `(${scripts.waitForResize})()`,
        returnByValue: true,
        awaitPromise: true,
      });
    };
    ```

    **Edge cases:**
    - `connect(browser)` fail (port sai) → throw.
    - `cdp.Browser.getWindowForTarget` fail → throw.
    - CDP close `cdp.close()` fail → throw.
    - Delta correction vẫn sai sau 3 lần → warning, không throw.

    **Tại sao:** Plugin path dùng chrome-remote-interface (khác Playwright path). Delta correction: `Browser.setWindowBounds` set outer bounds, `window.innerWidth` là viewport.

- [x] **Bước 2: Implement configure() + synchronize()** (file: `src/plugin/config.ts`, dòng 43-86)

    **configure signature:**
    ```ts
    export const configure = async (
      cleanup: CleanupFn,
      browser: Browser,
      bounds: ConfigureOptions = {},
      sync: SyncWrapper = async (fn) => fn()
    ): Promise<void>
    ```

    **Configure logic:**
    1. `browser.process.once('exit', () => cleanup(browser))` — cleanup khi process exit.
    2. `browser.configure = async () => { if (bounds.width && bounds.height) await sync(() => setViewport(browser, bounds)); }` — resize.
    3. `await browser.configure()` — chạy resize ngay.

    **synchronize signature:**
    ```ts
    export const synchronize = async (
      id: string,
      pwd: string,
      bounds: ViewportBounds = {},
      action: ActionFn = async () => {}
    ): Promise<void>
    ```

    **Synchronize 2-phase logic:**
    ```ts
    const configPath = `${pwd}/s/${id}1.ini`;
    await lock.acquire(id, async () => {
      let configContent = await readFile(configPath, 'utf8');
      for (const reset of [true, false]) {  // Phase 1: reset, Phase 2: set
        if (!reset) await Promise.resolve(action());  // resize
        for (const key of ['availWidth', 'availHeight']) {
          configContent = configContent.replace(
            new RegExp(`${key}=(.+)`),
            () => `${key}=${reset ? 'BAS_NOT_SET' : (bounds[key] ?? 'BAS_NOT_SET')}`
          );
        }
        await writeFile(configPath, configContent);
        await setTimeout(2000);  // delay 2s giữa 2 phase
      }
    });
    ```

    **Edge cases:**
    - File `.ini` không tồn tại → `readFile` throw.
    - `bounds.width`/`height` undefined → set `BAS_NOT_SET`.
    - AsyncLock tránh race condition khi nhiều instance.

    **Tại sao:** 2-phase: reset (notify engine đang resize) → action (resize) → set (notify xong). Delay 2s đảm bảo resize hoàn tất.

- [x] **Bước 3: setViewport() dùng Playwright CDPSession** (file: `src/adapter/playwright/utils.ts`, dòng 80-110)

    **Signature:**
    ```ts
    export const setViewport = async (
      page: Page,
      { diff, width = 0, height = 0 }: { diff?: { width: number; height: number }; width?: number; height?: number }
    ): Promise<void>
    ```

    **Khác biệt với plugin path:**
    - Dùng `page.context().newCDPSession(page)` thay `chrome-remote-interface.connect()`.
    - Dùng `cdp.send('Browser.setWindowBounds')` thay `cdp.Browser.setWindowBounds()`.
    - Dùng `page.evaluate(scripts.waitForResize)` thay `cdp.Runtime.evaluate()`.
    - Dùng `cdp.detach()` thay `cdp.close()`.

    **Tại sao:** 2 implementation không thể dùng chung — CDPSession từ page (Playwright) khác với CDP port (chrome-remote-interface).

- [x] **Bước 4: bindHooks chặn setViewportSize** (xem hook-binding plan)

- [x] **Bước 5: Tích hợp configure() vào Playwright bridge** (xem playwright-bridge plan)

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- Plugin path: chrome-remote-interface. Playwright path: CDPSession.
- Delta correction: bounds = target + delta → đo → correction → retry (max 3).
- `synchronize()` 2-phase: BAS_NOT_SET → resize (2s delay) → set value.
- DPI scaling, multi-monitor — delta có thể không chính xác.
