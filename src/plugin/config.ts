// ─── File: config.ts ─────────────────────────────────────────────────────
// Quản lý cấu hình viewport và đồng bộ settings file với BAS engine.
//
//   1. Configure – đăng ký cleanup, set viewport qua CDP
//   2. Synchronize – đồng bộ kích thước viewport vào file .ini
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import { readFile, writeFile } from 'fs/promises';

import AsyncLock from 'async-lock';

import { setViewport } from './browser';
import { sleep } from '../common/timer';
import type { Browser } from './launcher';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_POLL_INTERVAL = 500;
const MIN_POLL_INTERVAL = 100;

// ─── ConfigManager ───────────────────────────────────────────────────────────

export const getValidPollInterval = (interval: number | undefined): number => {
  if (typeof interval !== 'number' || Number.isNaN(interval) || interval < 0) {
    return DEFAULT_POLL_INTERVAL;
  }
  return Math.max(interval, MIN_POLL_INTERVAL);
};

export class ConfigManager {
  #lock = new AsyncLock();

  async configure(cleanup: CleanupFn, browser: Browser, bounds: ConfigureOptions = {}, sync: SyncWrapper = async fn => fn()): Promise<void> {
    browser.process.once('exit', () => { void cleanup(browser); });
    browser.configure = async (): Promise<void> => {
      if (bounds.width && bounds.height) {
        await sync(() => setViewport(browser, bounds as Required<ConfigureOptions>));
      }
    };
    await browser.configure();
  }

  async synchronize(id: string, pwd: string, bounds: ViewportBounds = {}, action: ActionFn = async () => {}, pollInterval?: number): Promise<void> {
    const configPath = `${pwd}/s/${id}1.ini`;
    const actualPollInterval = getValidPollInterval(pollInterval);
    await this.#lock.acquire(id, async () => {
      let configContent = await readFile(configPath, 'utf8');
      for (const reset of [true, false]) {
        if (!reset) {
          await Promise.resolve(action());
        }
        for (const [iniKey, boundsKey] of [['availWidth', 'width'], ['availHeight', 'height']] as const) {
          configContent = configContent.replace(new RegExp(`${iniKey}=(.+)`), (): string => {
            const value = reset ? 'BAS_NOT_SET' : bounds[boundsKey] ?? 'BAS_NOT_SET';
            return `${iniKey}=${String(value)}`;
          });
        }
        await writeFile(configPath, configContent);
        await sleep(actualPollInterval);
      }
    });
  }
}