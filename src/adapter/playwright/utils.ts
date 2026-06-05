// ─── File: adapter/playwright/utils.ts ─────────────────────────────────────
// Tiện ích Playwright -- hook binding, viewport resize, cleanup handler.
//
//   1. onClose() -- register clean-up handler (disconnected / close event)
//   2. bindHooks() -- proxy newContext/newPage/setViewportSize
//   3. setViewport() -- CDP-based resize (headed) với fallback page.setViewportSize (headless)
//   4. getViewport() -- lấy kích thước viewport từ in-browser script
// ─────────────────────────────────────────────────────────────────────────────

import type { Browser, BrowserContext, Page, CDPSession } from 'playwright-core';
import { scripts } from '../../common';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Số lần thử lại tối đa khi resize viewport qua CDP.
 * Cần retry vì `Browser.setWindowBounds` có thể không áp dụng chính xác ngay lần đầu
 * (window manager hoặc hiệu ứng animated resize làm lệch kích thước thực tế).
 */
export const MAX_RESIZE_RETRIES = 3;

// ─── Runtime ──────────────────────────────────────────────────────────────────

const originalSetViewportSize = new WeakMap<Page, Page['setViewportSize']>();

/**
 * Phân biệt Browser với BrowserContext để chọn đúng sự kiện cleanup.
 * Browser không có sự kiện `close`, chỉ có `disconnected` – nếu dùng nhầm sẽ bỏ sót cleanup.
 */
export const isBrowser = (target: unknown): target is Browser =>
  typeof target === 'object' &&
  target !== null &&
  'isConnected' in target &&
  'contexts' in target &&
  'version' in target &&
  typeof (target as Browser).version === 'function';

/**
 * Đăng ký handler dọn dẹp – dùng `disconnected` cho Browser (vì Browser không có `close`),
 * dùng `close` cho BrowserContext để bắt đúng thời điểm context đóng.
 */
export const onClose = (target: Browser | BrowserContext, listener: () => void): void => {
  if (isBrowser(target)) {
    target.once('disconnected', listener);
  } else {
    target.once('close', () => listener());
  }
};

/**
 * Hook để inject logic khi page mới được tạo (ví dụ: cài script chống fingerprint).
 * Gồm callback `onPageCreated` được gọi sau khi page mở.
 */
export type BrowserHooks = {
  onPageCreated?: (page: Page) => Promise<void> | void;
};

/**
 * Proxy các hàm tạo context/page và setViewportSize để:
 * 1. Ép `viewport: null` khi tạo context – tránh override viewport mặc định của browser,
 *    vì fingerprint đã khoá kích thước.
 * 2. Gọi `onPageCreated` hook để kịp inject script trước khi page load.
 * 3. Chặn `page.setViewportSize` bằng warning, vì viewport đã bị fingerprint lock,
 *    thay đổi sẽ làm lộ dấu vết.
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
    originalSetViewportSize.set(page, page.setViewportSize.bind(page));
    page.setViewportSize = new Proxy(page.setViewportSize, {
      apply: async () => {
        console.warn('[Fingerprint] Không thể thay đổi viewport: kích thước đã bị khoá bởi fingerprint.');
      },
    }) as typeof page.setViewportSize;
    return page;
  }
  if (!isBrowser(target) && !('newContext' in target)) {
    patchContext(target as BrowserContext);
  }
};

/**
 * Resize viewport thật của browser.
 * Ưu tiên dùng CDP `Browser.setWindowBounds` cho headed mode vì thay đổi kích thước
 * cửa sổ thật, không chỉ viewport nội dung. Nếu CDP không khả dụng (headless),
 * fallback về `page.setViewportSize` gốc với delta = 0 (headless không có window chrome).
 *
 * @param page - Trang cần resize
 * @param options - `width`, `height` mong muốn; `diff` là delta bù chrome window (headed).
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
  // --- Bước 1: Thử CDP Browser.setWindowBounds -- hoạt động ở headed mode
  let cdp: CDPSession | null = null;
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
    // CDP failed -- fallback bên dưới
  } finally {
    await cdp?.detach();
  }

  // --- Bước 2: Fallback -- dùng page.setViewportSize gốc (delta=0 cho headless)
  const orig = originalSetViewportSize.get(page);
  if (orig) {
    await orig({ width, height });
  } else {
    console.warn('[Fingerprint] Không thể resize viewport: không tìm thấy original setViewportSize.');
  }
};

/**
 * Lấy kích thước viewport hiện tại qua in-browser script.
 * Dùng `page.evaluate` để đo chính xác `window.innerWidth` / `innerHeight`.
 */
export const getViewport = (page: Page): Promise<{ width: number; height: number }> =>
  page.evaluate(scripts.getViewport) as Promise<{ width: number; height: number }>;

const waitForResize = (page: Page) => page.evaluate(scripts.waitForResize);

const resetOptions = <T extends Record<string, unknown>>(options: T = {} as T): T & { viewport: null } =>
  ({
    ...(options != null && typeof options === 'object' ? options : {}),
    viewport: null,
  }) as T & { viewport: null };
