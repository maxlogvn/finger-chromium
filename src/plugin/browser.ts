// ─── File: browser.ts ────────────────────────────────────────────────────
// Điều khiển browser qua CDP – set viewport, get viewport, resize.
//
//   1. Kết nối CDP tới browser
//   2. Lấy windowId
//   3. Set window bounds với retry logic
//   4. Verify viewport chính xác
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import type { Client } from 'chrome-remote-interface';
import connect from 'chrome-remote-interface';
import debugFactory from 'debug';

import { scripts } from '../common';
import { PluginError } from './errors';
import type { Browser } from './launcher';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ViewportBounds {
  width: number;
  height: number;
}
interface ViewportDiff {
  width: number;
  height: number;
}
interface SetViewportOptions {
  diff?: ViewportDiff;
  width: number;
  height: number;
}
interface RuntimeEvaluateResult<T = unknown> {
  result: {
    value: T;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_RESIZE_RETRIES = 3;
const DEFAULT_DIFF = {
  width: 16,
  height: 88
};
const debug = debugFactory('browser-with-fingerprints:plugin:browser');

// ─── Viewport Operations ─────────────────────────────────────────────────────

export const setViewport = async (browser: Browser, {
  diff,
  width,
  height
}: SetViewportOptions): Promise<void> => {
  let cdp: Client | undefined;
  try {
    cdp = await connect(browser);
  } catch (err) {
    throw new PluginError(`[BrowserEngine] Không thể kết nối CDP tới browser: ${err instanceof Error ? err.message : String(err)}`);
  }
  let windowId: number;
  try {
    const targetInfo = await cdp.Browser.getWindowForTarget();
    windowId = targetInfo.windowId;
  } catch (err) {
    await cdp.close();
    throw new PluginError(`[BrowserEngine] Không thể lấy windowId qua CDP: ${err instanceof Error ? err.message : String(err)}`);
  }
  const delta = diff ? {
    ...diff
  } : {
    ...DEFAULT_DIFF
  };
  let success = false;
  for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
    const bounds: ViewportBounds = {
      width: width + delta.width,
      height: height + delta.height
    };
    try {
      await Promise.all([cdp.Browser.setWindowBounds({
        bounds,
        windowId
      }), waitForResize(cdp)]);
    } catch (err) {
      await cdp.close();
      throw new PluginError(`[BrowserEngine] Thao tác setWindowBounds thất bại: ${err instanceof Error ? err.message : String(err)}`);
    }
    const viewport = await getViewport(cdp);
    if (width === viewport.width && height === viewport.height) {
      success = true;
      break;
    }
    debug(`Lần thử ${String(i + 1)}: sai lệch viewport = (${String(viewport.width - width)}, ${String(viewport.height - height)})`);
    delta.height += height - viewport.height;
    delta.width += width - viewport.width;
  }
  await cdp.close();
  if (!success) {
    throw new PluginError(`[BrowserEngine] Không thể đặt viewport chính xác (${String(width)}x${String(height)}) sau ${String(MAX_RESIZE_RETRIES)} lần thử.`);
  }
};

export const getViewport = async (cdp: Client): Promise<ViewportBounds> => {
  try {
    const {
      result
    } = (await cdp.Runtime.evaluate({
      expression: `(${String(scripts.getViewport)})()`,
      returnByValue: true
    })) as RuntimeEvaluateResult<ViewportBounds>;
    return result.value;
  } catch (err) {
    throw new PluginError(`[BrowserEngine] Không thể lấy viewport qua CDP: ${err instanceof Error ? err.message : String(err)}`);
  }
};

const waitForResize = async (cdp: Client): Promise<void> => {
  try {
    await cdp.Runtime.evaluate({
      expression: `(${String(scripts.waitForResize)})()`,
      returnByValue: true,
      awaitPromise: true
    });
  } catch (err) {
    throw new PluginError(`[BrowserEngine] waitForResize thất bại: ${err instanceof Error ? err.message : String(err)}`);
  }
};