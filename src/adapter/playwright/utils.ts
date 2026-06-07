// ─── File: utils.ts ──────────────────────────────────────────────────────
// Utility cho Playwright adapter – viewport, hooks, type guards.
//
//   1. isBrowser / onClose – type guard và lifecycle hooks
//   2. bindHooks – proxy context/page creation để inject resize
//   3. setViewport / getViewport – resize viewport qua CDP
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import type { Browser, BrowserContext, Page, CDPSession } from 'playwright-core';
import { scripts } from '../../common';

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_RESIZE_RETRIES = 3;
const originalSetViewportSize = new WeakMap<Page, Page['setViewportSize']>();

// ─── Type Guards ─────────────────────────────────────────────────────────────

export const isBrowser = (target: unknown): target is Browser => typeof target === 'object' && target !== null && 'isConnected' in target && 'contexts' in target && 'version' in target && typeof (target as Browser).version === 'function';

// ─── Lifecycle Hooks ─────────────────────────────────────────────────────────

export const onClose = (target: Browser | BrowserContext, listener: () => void): void => {
  if (isBrowser(target)) {
    target.once('disconnected', listener);
  } else {
    target.once('close', () => listener());
  }
};

export type BrowserHooks = {
  onPageCreated?: (page: Page) => Promise<void> | void;
};

export const bindHooks = (target: Browser | BrowserContext, hooks: BrowserHooks = {}): void => {
  if (isBrowser(target)) {
    target.newContext = new Proxy(target.newContext, {
      apply: (fn, ctx, [opts]) => fn.call(ctx, resetOptions(opts)).then(patchContext)
    }) as typeof target.newContext;
  }
  function patchContext(ctx: BrowserContext): BrowserContext {
    ctx.newPage = new Proxy(ctx.newPage, {
      async apply(fn, ctx) {
        const page = await fn.call(ctx);
        await hooks.onPageCreated?.(page);
        return patchPage(page);
      }
    }) as typeof ctx.newPage;
    return ctx;
  }
  function patchPage(page: Page): Page {
    originalSetViewportSize.set(page, page.setViewportSize.bind(page));
    page.setViewportSize = new Proxy(page.setViewportSize, {
      apply: async () => {
        console.warn('[Fingerprint] Không thể thay đổi viewport: kích thước đã bị khoá bởi fingerprint.');
      }
    }) as typeof page.setViewportSize;
    return page;
  }
  if (!isBrowser(target) && !('newContext' in target)) {
    patchContext(target as BrowserContext);
  }
};

// ─── Viewport Operations ─────────────────────────────────────────────────────

export const setViewport = async (page: Page, {
  diff,
  width = 0,
  height = 0
}: {
  diff?: {
    width: number;
    height: number;
  };
  width?: number;
  height?: number;
}): Promise<void> => {
  let cdp: CDPSession | null = null;
  try {
    cdp = await page.context().newCDPSession(page);
    const {
      windowId
    } = await cdp.send('Browser.getWindowForTarget');
    const delta = diff ? {
      ...diff
    } : {
      width: 16,
      height: 88
    };
    for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
      const bounds = {
        width: width + delta.width,
        height: height + delta.height
      };
      await Promise.all([cdp.send('Browser.setWindowBounds', {
        bounds,
        windowId
      }), waitForResize(page)]);
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
  } catch {} finally {
    await cdp?.detach();
  }
  const orig = originalSetViewportSize.get(page);
  if (orig) {
    await orig({
      width,
      height
    });
  } else {
    console.warn('[Fingerprint] Không thể resize viewport: không tìm thấy original setViewportSize.');
  }
};

export const getViewport = (page: Page): Promise<{
  width: number;
  height: number;
}> => page.evaluate(scripts.getViewport) as Promise<{
  width: number;
  height: number;
}>;

const waitForResize = (page: Page) => page.evaluate(scripts.waitForResize);

const resetOptions = <T extends Record<string, unknown>>(options: T = {} as T): T & {
  viewport: null;
} => ({
  ...(options != null && typeof options === 'object' ? options : {}),
  viewport: null
}) as T & {
  viewport: null;
};

export async function collectErrors(
  ...steps: [string, () => unknown][]
): Promise<string[]> {
  const errs: string[] = [];
  for (const [name, fn] of steps) {
    try {
      await fn();
    } catch (e) {
      errs.push(`[${name}] ${(e as Error).message}`);
    }
  }
  return errs;
}