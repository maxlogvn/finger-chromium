// ─── File: common/timer.ts ──────────────────────────────────────────────────
// Centralized timer utility -- API duy nhất cho mọi nhu cầu timer trong codebase.
// Dùng `timers/promises` làm nền, thêm `createTimer()` cho use-case cần clearTimeout.
//
//   1. sleep(ms) -- delay Promise-based, tự động unref
//   2. withTimeout(promise, ms, msg?) -- race promise với timeout, throw TimeoutError
//   3. createTimer(ms) -- thay callback-style setTimeout + clearTimeout
// ─────────────────────────────────────────────────────────────────────────────

import { setTimeout as sleepPromise } from 'timers/promises';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimerHandle {
  promise: Promise<void>;
  clear: () => void;
}

/**
 * Lỗi timeout dùng chung cho withTimeout().
 * Throw khi promise không kịp hoàn thành trước deadline.
 * Consumer có thể dùng `instanceof TimeoutError` để phân biệt.
 */
export class TimeoutError extends Error {
  name = 'TimeoutError';
}

/**
 * Delay đơn giản, tự động unref (không giữ event loop).
 * Dùng `timers/promises` bên trong với `ref: false`.
 *
 * @example
 * await sleep(1000); // chờ 1 giây
 */
export const sleep = (ms: number): Promise<void> => sleepPromise(ms, undefined, { ref: false });

/**
 * Race một promise với timeout.
 * Nếu promise hoàn thành trước deadline → trả về kết quả.
 * Nếu timeout trước → throw `TimeoutError` với message tuỳ chọn.
 * Timer tự động clear khi promise hoàn thành (qua finally).
 *
 * @example
 * const data = await withTimeout(fetch(url), 5000, 'Fetch timeout');
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  const timer = createTimer(ms);
  return Promise.race([
    promise,
    timer.promise.then(() => {
      throw new TimeoutError(message ?? 'Timeout');
    }),
  ]).finally(() => timer.clear());
}

/**
 * Tạo timer có thể huỷ — thay thế cho callback-style `setTimeout` + `clearTimeout`.
 * Trả về `{ promise, clear }`:
 *   - `promise` resolve sau `ms` milliseconds nếu không bị clear.
 *   - `clear()` huỷ timer, promise sẽ không bao giờ resolve.
 * Timer tự động unref để không giữ event loop.
 *
 * @example
 * const timer = createTimer(5000);
 * timer.promise.then(() => reject(new Error('Timeout')));
 * // Sau đó, nếu không cần timeout nữa:
 * timer.clear();
 */
export function createTimer(ms: number): TimerHandle {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve();
    }, ms);
    // Chỉ gọi unref nếu tồn tại (tránh lỗi trên môi trường không phải Node)
    if (timeoutId && typeof timeoutId.unref === 'function') {
      timeoutId.unref();
    }
  });
  return {
    promise,
    clear: () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    },
  };
}
