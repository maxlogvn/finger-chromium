// ─── File: plugin/browser.ts ───────────────────────────────────────────────
// Resize chính xác viewport Fluent thông qua CDP, tự động hiệu chỉnh sai lệch
// do khung viền trình duyệt (title bar, border).
//
//   1. Kết nối CDP tới browser instance
//   2. Lấy windowId từ Browser.getWindowForTarget
//   3. Retry resize tối đa MAX_RESIZE_RETRIES lần, điều chỉnh delta theo sai lệch
//   4. Ngắt kết nối CDP, ném lỗi nếu không đặt được kích thước yêu cầu
// ─────────────────────────────────────────────────────────────────────────────

import type { Client } from 'chrome-remote-interface';
import connect from 'chrome-remote-interface';
import debugFactory from 'debug';
import { scripts } from '../common';
import { PluginError } from './errors';
import type { Browser } from './launcher';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_RESIZE_RETRIES = 3;
const DEFAULT_DIFF = { width: 16, height: 88 };
const debug = debugFactory('browser-with-fingerprints:plugin:browser');

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Resize viewport trình duyệt qua CDP, thử lại tối đa `MAX_RESIZE_RETRIES` lần.
 * Việc resize cần retry vì `Browser.setWindowBounds` đặt kích thước cửa sổ (bao gồm cả khung viền),
 * nhưng viewport thực tế (khu vực hiển thị nội dung web) nhỏ hơn do title bar và border.
 * Hàm tự động hiệu chỉnh delta dựa trên sai lệch đo được sau mỗi lần thử.
 *
 * @throws {PluginError} Nếu không thể đạt được kích thước viewport chính xác sau tất cả lần thử,
 *                       hoặc khi có lỗi kết nối CDP / thao tác cửa sổ.
 */
export const setViewport = async (browser: Browser, { diff, width, height }: SetViewportOptions): Promise<void> => {
  // --- Bước 1: Kết nối CDP tới browser và lấy windowId
  let cdp: Client | undefined;
  try {
    cdp = await connect(browser);
  } catch (err) {
    throw new PluginError(
      `[BrowserEngine] Không thể kết nối CDP tới browser: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let windowId: number;
  try {
    const targetInfo = await cdp.Browser.getWindowForTarget();
    windowId = targetInfo.windowId;
  } catch (err) {
    await cdp.close();
    throw new PluginError(
      `[BrowserEngine] Không thể lấy windowId qua CDP: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // --- Bước 2: Khởi tạo delta ban đầu (sai lệch giữa cửa sổ và viewport)
  const delta = diff ? { ...diff } : { ...DEFAULT_DIFF };
  let success = false;

  // --- Bước 3: Retry resize với hiệu chỉnh delta dựa trên sai lệch thực tế
  for (let i = 0; i < MAX_RESIZE_RETRIES; ++i) {
    const bounds: ViewportBounds = {
      width: width + delta.width,
      height: height + delta.height,
    };

    try {
      await Promise.all([cdp.Browser.setWindowBounds({ bounds, windowId }), waitForResize(cdp)]);
    } catch (err) {
      await cdp.close();
      throw new PluginError(
        `[BrowserEngine] Thao tác setWindowBounds thất bại: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const viewport = await getViewport(cdp);
    if (width === viewport.width && height === viewport.height) {
      success = true;
      break;
    }

    debug(`Lần thử ${i + 1}: sai lệch viewport = (${viewport.width - width}, ${viewport.height - height})`);
    // --- Điều chỉnh delta dựa trên sai lệch đo được
    delta.height += height - viewport.height;
    delta.width += width - viewport.width;
  }

  // --- Bước 4: Ngắt kết nối và kiểm tra kết quả
  await cdp.close();

  if (!success) {
    throw new PluginError(
      `[BrowserEngine] Không thể đặt viewport chính xác (${width}x${height}) sau ${MAX_RESIZE_RETRIES} lần thử.`
    );
  }
};

/**
 * Lấy kích thước viewport hiện tại thông qua CDP Runtime.evaluate.
 * Sử dụng CDP thay vì Playwright API vì Playwright không cung cấp kích thước viewport
 * chính xác ngay sau khi resize qua CDP (có độ trễ cập nhật).
 *
 * @throws {PluginError} Nếu evaluate JavaScript thất bại hoặc không nhận được kết quả.
 */
export const getViewport = async (cdp: Client): Promise<ViewportBounds> => {
  try {
    const { result } = (await cdp.Runtime.evaluate({
      expression: `(${scripts.getViewport})()`,
      returnByValue: true,
    })) as RuntimeEvaluateResult<ViewportBounds>;
    return result.value;
  } catch (err) {
    throw new PluginError(
      `[BrowserEngine] Không thể lấy viewport qua CDP: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};

/**
 * Chờ đợi trình duyệt hoàn tất resize layout sau khi thay đổi kích thước cửa sổ.
 * Dùng `requestAnimationFrame` và `resize observer` trong script để đảm bảo DOM đã cập nhật.
 * Việc chờ này là cần thiết vì `Browser.setWindowBounds` không đợi layout hoàn tất,
 * dẫn đến `getViewport` có thể trả về kích thước cũ.
 *
 * @throws {PluginError} Nếu script chờ không thực thi được (timeout hoặc lỗi runtime).
 */
const waitForResize = async (cdp: Client): Promise<void> => {
  try {
    await cdp.Runtime.evaluate({
      expression: `(${scripts.waitForResize})()`,
      returnByValue: true,
      awaitPromise: true,
    });
  } catch (err) {
    throw new PluginError(
      `[BrowserEngine] waitForResize thất bại: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};
