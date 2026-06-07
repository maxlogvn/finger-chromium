// ─── File: timer.ts ──────────────────────────────────────────────────────
// Utility cho timer, sleep, và timeout handling.
//
//   1. sleep – promise-based sleep không giữ event loop
//   2. createTimer – tạo timer có thể huỷ
//   3. withTimeout – race promise với timeout
//   4. TimeoutError – error class cho timeout
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import { setTimeout as sleepPromise } from 'timers/promises';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimerHandle {
  promise: Promise<void>;
  clear: () => void;
}

// ─── Error Classes ───────────────────────────────────────────────────────────

export class TimeoutError extends Error {
  name = 'TimeoutError';
}

// ─── Sleep ───────────────────────────────────────────────────────────────────

export const sleep = (ms: number): Promise<void> => sleepPromise(ms, undefined, {
  ref: false
});

// ─── Timer Utilities ─────────────────────────────────────────────────────────

export function createTimer(ms: number): TimerHandle {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<void>(resolve => {
    timeoutId = setTimeout(() => {
      resolve();
    }, ms);
    if (typeof timeoutId.unref === 'function') {
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
    }
  };
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  const timer = createTimer(ms);
  return Promise.race([promise, timer.promise.then(() => {
    throw new TimeoutError(message ?? 'Timeout');
  })]).finally(() => { timer.clear(); });
}