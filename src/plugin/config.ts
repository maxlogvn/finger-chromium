// ─── File: plugin/config.ts ────────────────────────────────────────────────
// Cấu hình browser engine -- resize viewport và đồng bộ availWidth/availHeight
// vào file .ini của engine.
//
//   1. configure() -- đăng ký cleanup + resize viewport
//   2. synchronize() -- cập nhật availWidth/availHeight vào .ini
// ─────────────────────────────────────────────────────────────────────────────

import AsyncLock from 'async-lock';
import { setViewport } from './browser';
import { setTimeout } from 'timers/promises';
import { readFile, writeFile } from 'fs/promises';
import type { Browser } from './launcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViewportBounds {
  width?: number;
  height?: number;
  [key: string]: number | undefined;
}

type SyncWrapper = <T>(fn: () => Promise<T> | T) => Promise<T>;
type CleanupFn = (browser: Browser) => void | Promise<void>;
type ActionFn = () => Promise<void> | void;

interface ConfigureOptions {
  width?: number;
  height?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const lock = new AsyncLock();

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Cấu hình browser sau spawn -- đăng ký cleanup handler và resize viewport.
 * Dùng process.on('exit') thay vì browser event để đảm bảo dọn dẹp
 * ngay cả khi process bị kill.
 */
export const configure = async (
  cleanup: CleanupFn,
  browser: Browser,
  bounds: ConfigureOptions = {},
  sync: SyncWrapper = async (fn) => fn()
): Promise<void> => {
  browser.process.once('exit', () => cleanup(browser));
  browser.configure = async (): Promise<void> => {
    if (bounds.width && bounds.height) {
      await sync(() => setViewport(browser, bounds as Required<ConfigureOptions>));
    }
  };
  await browser.configure();
};

/**
 * Đồng bộ availWidth/availHeight vào file .ini của engine.
 * Trước action: set BAS_NOT_SET (reset), sau action: set giá trị thật.
 * Dùng AsyncLock để tránh race condition khi nhiều instance cùng ghi.
 */
export const synchronize = async (
  id: string,
  pwd: string,
  bounds: ViewportBounds = {},
  action: ActionFn = async () => {}
): Promise<void> => {
  const configPath = `${pwd}/s/${id}1.ini`;
  await lock.acquire(id, async () => {
    let configContent = await readFile(configPath, 'utf8');
    for (const reset of [true, false]) {
      if (!reset) {
        await Promise.resolve(action());
      }
      for (const [iniKey, boundsKey] of [['availWidth', 'width'], ['availHeight', 'height']] as const) {
        configContent = configContent.replace(new RegExp(`${iniKey}=(.+)`), (): string => {
          const value = reset ? 'BAS_NOT_SET' : (bounds[boundsKey] ?? 'BAS_NOT_SET');
          return `${iniKey}=${value}`;
        });
      }
      await writeFile(configPath, configContent);
      await setTimeout(2000);
    }
  });
};
