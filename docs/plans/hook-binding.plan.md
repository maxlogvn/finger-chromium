# Plan: Hook Binding

## Các bước thực hiện

- [x] **Bước 1: Implement isBrowser() type guard** (file: `src/adapter/playwright/utils.ts`, dòng 19-23)

    **Signature:**
    ```ts
    const isBrowser = (target: unknown): target is Browser =>
      typeof target === 'object' && target !== null && 'version' in target && typeof (target as Browser).version === 'function';
    ```

    **Logic:** Duck-typing — kiểm tra `target` có `version()` method không. Browser (Playwright) có `version()`, BrowserContext không có.

    **Edge cases:**
    - `target = null` → `typeof null === 'object'` → `target !== null` catch.
    - `target = { version: 'abc' }` (string, not function) → false.

    **Tại sao:** Duck-typing thay vì `instanceof` — Playwright có thể nhiều versions, `instanceof` không đáng tin.

- [x] **Bước 2: Implement onClose()** (file: `src/adapter/playwright/utils.ts`, dòng 29-35)

    **Signature:**
    ```ts
    export const onClose = (target: Browser | BrowserContext, listener: () => void): void
    ```

    **Logic:**
    ```ts
    if (isBrowser(target)) target.once('disconnected', listener);
    else target.once('close', () => listener());
    ```

    **Edge cases:**
    - Browser disconnect → listener chạy 1 lần.
    - BrowserContext close → listener chạy 1 lần.
    - Gọi onClose nhiều lần → mỗi lần đăng ký handler mới (dùng once nên tự remove sau khi chạy).

    **Tại sao:** `once()` tránh memory leak — handler tự remove sau khi chạy. Browser vs BrowserContext dùng event khác nhau.

- [x] **Bước 3: Implement bindHooks()** (file: `src/adapter/playwright/utils.ts`, dòng 46-73)

    **Signature:**
    ```ts
    export const bindHooks = (target: Browser | BrowserContext, hooks: BrowserHooks = {}): void
    export type BrowserHooks = { onPageCreated?: (page: Page) => Promise<void> | void };
    ```

    **Logic chi tiết:**
    ```ts
    if (isBrowser(target)) {
      // Proxy newContext → resetOptions + patchContext
      target.newContext = new Proxy(target.newContext, {
        apply: (fn, ctx, [opts]) => fn.call(ctx, resetOptions(opts)).then(patchContext),
      }) as typeof target.newContext;
    }
    function patchContext(ctx: BrowserContext): BrowserContext {
      ctx.newPage = new Proxy(ctx.newPage, {
        async apply(fn, ctx) {
          const page = await fn.call(ctx);
          await hooks.onPageCreated?.(page);  // resize hook
          return patchPage(page);             // proxy setViewportSize
        },
      }) as typeof ctx.newPage;
      return ctx;
    }
    function patchPage(page: Page): Page {
      page.setViewportSize = new Proxy(page.setViewportSize, {
        apply: async () => console.warn('[Fingerprint] Không thể thay đổi viewport...'),
      }) as typeof page.setViewportSize;
      return page;
    }
    if (!isBrowser(target) && !(target as any).newContext) {
      patchContext(target as BrowserContext);  // target là context (từ newContext trước)
    }
    ```

    **Edge cases:**
    - BrowserContext target (từ `launchPersistentContext` không qua newContext proxy) → `!(target as any).newContext` → true → patchContext trực tiếp.
    - `hooks.onPageCreated` undefined → `?.()` operator → skip.
    - `setViewportSize` bị chặn → warning mỗi lần gọi.

    **Tại sao:** Proxy pattern intercept mà không cần subclass. Force viewport null ngăn Playwright resize trước fingerprint. Chặn setViewportSize giữ fingerprint ổn định.

- [x] **Bước 4: Implement setViewport() — CDPSession path** (file: `src/adapter/playwright/utils.ts`, dòng 80-110)

    **Signature:**
    ```ts
    export const setViewport = async (
      page: Page,
      { diff, width = 0, height = 0 }: { diff?: { width: number; height: number }; width?: number; height?: number }
    ): Promise<void>
    ```

    **Constants:** `export const MAX_RESIZE_RETRIES = 3;`

    **Logic chi tiết:**
    ```ts
    const delta = diff ? { ...diff } : { width: 16, height: 88 };
    const cdp = await page.context().newCDPSession(page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
      const bounds = { width: width + delta.width, height: height + delta.height };
      await Promise.all([
        cdp.send('Browser.setWindowBounds', { bounds, windowId }),
        waitForResize(page)  // page.evaluate(scripts.waitForResize)
      ]);
      const viewport = await getViewport(page);  // page.evaluate(scripts.getViewport)
      if (width === viewport.width && height === viewport.height) break;
      if (i === MAX_RESIZE_RETRIES - 1) console.warn('[Fingerprint] Không thể đặt kích thước viewport chính xác.');
      delta.height += height - viewport.height;  // correction
      delta.width += width - viewport.width;
    }
    await cdp.detach();
    ```

    **Delta correction algorithm:**
    ```
    Lần 1: bounds = (1920 + 16, 1080 + 88) = 1936x1168
      → viewport thực = 1900x1050 (sai lệch 20x30)
      → delta = (16 + 20, 88 + 30) = (36, 118)
    Lần 2: bounds = (1920 + 36, 1080 + 118) = 1956x1198
      → viewport thực = 1920x1080 (đúng) → break
    ```

    **Helper functions (dòng 115-121):**
    ```ts
    export const getViewport = (page: Page) => page.evaluate(scripts.getViewport);
    const waitForResize = (page: Page) => page.evaluate(scripts.waitForResize);
    const resetOptions = <T extends Record<string, unknown>>(options: T = {} as T): T & { viewport: null } =>
      ({ ...(options ?? {}), viewport: null }) as T & { viewport: null };
    ```

    **Edge cases:**
    - `width = 0, height = 0` → set bounds = delta (không resize).
    - CDP session fail (page closed) → throw.
    - Sau 3 lần vẫn sai → warning, không throw.
    - `diff` từ plugin (`bounds` từ fingerprint) → dùng làm delta base.

    **Tại sao:** Delta correction cần vì `Browser.setWindowBounds` set outer window bounds, `window.innerWidth` là viewport. Retry 3 lần vì lần đầu thường sai do timing.

- [x] **Bước 5: Tích hợp vào configure() trong Playwright bridge** (xem playwright-bridge plan)

    **Logic:** `configure()` trong `engine.ts` gọi `onClose(context, cleanup)`, tạo resize function, gọi `bindHooks(context, { onPageCreated: resize })`, resize page đầu.

    **Tại sao:** configure() override từ plugin — Playwright path dùng CDPSession, khác plugin path (chrome-remote-interface). `sync()` dùng AsyncLock tránh race condition resize nhiều page.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- `setViewport()` 2 implementation: plugin (chrome-remote-interface) vs Playwright (CDPSession).
- Delta correction: nếu viewport mong muốn 1920x1080, CDP set ~1936x1168 (16x88 delta).
- DPI scaling, multi-monitor — delta có thể không chính xác → warning.
- `resetOptions` handle options null/undefined — force viewport null.
