import type { Client } from 'chrome-remote-interface';
import connect from 'chrome-remote-interface';
import { scripts } from '../common';
import type { Browser } from './launcher';

export const MAX_RESIZE_RETRIES = 3;
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
export const setViewport = async (browser: Browser, { diff, width, height }: SetViewportOptions): Promise<void> => {
  const cdp = await connect(browser);
  const { windowId } = await cdp.Browser.getWindowForTarget();
  const delta = diff ? { ...diff } : { width: 16, height: 88 };
  for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
    const bounds: ViewportBounds = {
      width: width + delta.width,
      height: height + delta.height,
    };
    await Promise.all([cdp.Browser.setWindowBounds({ bounds, windowId }), waitForResize(cdp)]);
    const viewport = await getViewport(cdp);
    if (width === viewport.width && height === viewport.height) {
      break;
    } else if (i === MAX_RESIZE_RETRIES - 1) {
      console.warn('Không thể đặt kích thước viewport chính xác.');
    }
    delta.height += height - viewport.height;
    delta.width += width - viewport.width;
  }
  await cdp.close();
};
export const getViewport = async (cdp: Client): Promise<ViewportBounds> => {
  const { result } = (await cdp.Runtime.evaluate({
    expression: `(${scripts.getViewport})()`,
    returnByValue: true,
  })) as RuntimeEvaluateResult<ViewportBounds>;
  return result.value;
};
const waitForResize = async (cdp: Client): Promise<void> => {
  await cdp.Runtime.evaluate({
    expression: `(${scripts.waitForResize})()`,
    returnByValue: true,
    awaitPromise: true,
  });
};
