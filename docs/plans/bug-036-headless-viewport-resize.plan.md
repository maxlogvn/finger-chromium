# Headless Viewport Resize Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `setViewport()` so it works correctly in headless mode by falling back from CDP `Browser.setWindowBounds` to `page.setViewportSize()`.

**Architecture:** Add `WeakMap<Page, Function>` to store original `setViewportSize` before `bindHooks()` proxies it. Modify `setViewport()` to try CDP first, then fallback to `page.setViewportSize()` with delta=0 if CDP fails or viewport is still wrong after retries.

**Tech Stack:** TypeScript, Playwright Core, CDP (chrome-remote-interface)

---

### Task 1: Modify `src/adapter/playwright/utils.ts` — add WeakMap store + fallback logic

**Files:**
- Modify: `src/adapter/playwright/utils.ts:64-112`

- [ ] **Step 1: Add WeakMap and save original in `patchPage()`**

Add a module-level `WeakMap` to store each page's original `setViewportSize`. Modify `patchPage()` to save the original before proxying.

```ts
// ─── Runtime ──────────────────────────────────────────────────────────────────

const originalSetViewportSize = new WeakMap<Page, Page['setViewportSize']>();
```

```ts
  function patchPage(page: Page): Page {
    originalSetViewportSize.set(page, page.setViewportSize.bind(page));
    page.setViewportSize = new Proxy(page.setViewportSize, {
      apply: async () => {
        console.warn('[Fingerprint] Không thể thay đổi viewport: kích thước đã bị khoá bởi fingerprint.');
      },
    }) as typeof page.setViewportSize;
    return page;
  }
```

- [ ] **Step 2: Rewrite `setViewport()` with CDP + fallback**

Wrap CDP logic in try/catch. After CDP retries fail, fallback to `page.setViewportSize()` with delta=0 (no window chrome in headless). Move `console.warn` to the fallback path.

```ts
export const setViewport = async (
  page: Page,
  {
    diff,
    width = 0,
    height = 0,
  }: {
    diff?: { width: number; height: number };
    width?: number;
    height?: number;
  }
): Promise<void> => {
  // --- Bước 1: Thử CDP Browser.setWindowBounds — hoạt động ở headed mode
  let cdp: import('playwright-core').CDPSession | null = null;
  try {
    cdp = await page.context().newCDPSession(page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    const delta = diff ? { ...diff } : { width: 16, height: 88 };
    for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
      const bounds = { width: width + delta.width, height: height + delta.height };
      await Promise.all([cdp.send('Browser.setWindowBounds', { bounds, windowId }), waitForResize(page)]);
      const viewport = await getViewport(page);
      if (width === viewport.width && height === viewport.height) {
        return;
      }
      if (i === MAX_RESIZE_RETRIES - 1) {
        break;
      }
      delta.height += height - viewport.height;
      delta.width += width - viewport.width;
    }
  } catch {
    // CDP failed — fallback bên dưới
  } finally {
    await cdp?.detach();
  }

  // --- Bước 2: Fallback — dùng page.setViewportSize gốc (delta=0 cho headless)
  const orig = originalSetViewportSize.get(page);
  if (orig) {
    await orig({ width, height });
  } else {
    console.warn('[Fingerprint] Không thể resize viewport: không tìm thấy original setViewportSize.');
  }
};
```

- [ ] **Step 3: Update JSDoc comment**

```ts
/**
 * Resize viewport — thử CDP Browser.setWindowBounds trước (headed mode).
 * Nếu CDP không hoạt động (headless mode), fallback sang page.setViewportSize().
 * delta cho fallback là 0 (headless không có window chrome).
 */
```

- [ ] **Step 4: Update header comment in file**

Change the file header from:
```
//   3. setViewport() -- CDP-based resize với retry
```
to:
```
//   3. setViewport() -- CDP-based resize (headed) với fallback page.setViewportSize (headless)
```

---

### Task 2: Verify tests pass

- [ ] **Step 1: Run existing tests**

Run: `npm test`
Expected: All 164 tests pass (existing tests already run with `headless: true`).

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds (ESM + CJS).
