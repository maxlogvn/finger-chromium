// ─── File: adapter/playwright/utils.ts ─────────────────────────────────────
// Tiện ích Playwright -- hook binding, viewport resize, cleanup handler.
//
//   1. onClose() -- register clean-up handler (disconnected / close event)
//   2. bindHooks() -- proxy newContext/newPage/setViewportSize
//   3. setViewport() -- CDP-based resize với retry
//   4. getViewport() -- lấy kích thước viewport từ in-browser script
// ─────────────────────────────────────────────────────────────────────────────

import type { Browser, BrowserContext, Page } from 'playwright-core';
import { scripts } from '../../common';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_RESIZE_RETRIES = 3;

// ─── Runtime ──────────────────────────────────────────────────────────────────

const isBrowser = (target: unknown): target is Browser =>
  typeof target === 'object' &&
  target !== null &&
  'version' in target &&
  typeof (target as Browser).version === 'function';

/**
 * Đăng ký handler dọn dẹp -- dùng disconnected event cho Browser,
 * close event cho BrowserContext.
 */
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

/**
 * Proxy newContext/newPage/setViewportSize để intercept việc tạo page
 * và gọi onPageCreated hook -- đảm bảo viewport luôn đúng kích thước.
 * setViewportSize bị chặn vì kích thước đã bị fingerprint lock.
 */
export const bindHooks = (target: Browser | BrowserContext, hooks: BrowserHooks = {}): void => {
  if (isBrowser(target)) {
    target.newContext = new Proxy(target.newContext, {
      apply: (fn, ctx, [opts]) => fn.call(ctx, resetOptions(opts)).then(patchContext),
    }) as typeof target.newContext;
  }
  function patchContext(ctx: BrowserContext): BrowserContext {
    ctx.newPage = new Proxy(ctx.newPage, {
      async apply(fn, ctx) {
        const page = await fn.call(ctx);
        await hooks.onPageCreated?.(page);
        return patchPage(page);
      },
    }) as typeof ctx.newPage;
    return ctx;
  }
  function patchPage(page: Page): Page {
    page.setViewportSize = new Proxy(page.setViewportSize, {
      apply: async () => {
        console.warn('[Fingerprint] Không thể thay đổi viewport: kích thước đã bị khoá bởi fingerprint.');
      },
    }) as typeof page.setViewportSize;
    return page;
  }
  if (!isBrowser(target) && !(target as any).newContext) {
    patchContext(target as BrowserContext);
  }
};

/**
 * Resize viewport qua CDP -- thử tối đa MAX_RESIZE_RETRIES lần.
 * delta ban đầu là 16x88 (khung viền trình duyệt), sau mỗi lần thất bại
 * tự điều chỉnh delta để đạt đúng kích thước mong muốn.
 */
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
  const delta = diff ? { ...diff } : { width: 16, height: 88 };
  const cdp = await page.context().newCDPSession(page);
  const { windowId } = await cdp.send('Browser.getWindowForTarget');
  for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
    const bounds = { width: width + delta.width, height: height + delta.height };
    await Promise.all([cdp.send('Browser.setWindowBounds', { bounds, windowId }), waitForResize(page)]);
    const viewport = await getViewport(page);
    if (width === viewport.width && height === viewport.height) {
      break;
    }
    if (i === MAX_RESIZE_RETRIES - 1) {
      console.warn('[Fingerprint] Không thể đặt kích thước viewport chính xác sau nhiều lần thử.');
      break;
    }
    delta.height += height - viewport.height;
    delta.width += width - viewport.width;
  }
  await cdp.detach();
};

/**
 * Lấy kích thước viewport hiện tại qua in-browser script.
 */
export const getViewport = (page: Page): Promise<{ width: number; height: number }> =>
  page.evaluate(scripts.getViewport) as Promise<{ width: number; height: number }>;

const waitForResize = (page: Page) => page.evaluate(scripts.waitForResize);

const resetOptions = <T extends Record<string, unknown>>(options: T = {} as T): T & { viewport: null } =>
  ({
    ...(options != null && typeof options === 'object' ? options : {}),
    viewport: null,
  }) as T & { viewport: null };
