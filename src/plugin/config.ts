// ─── File: plugin/config.ts ────────────────────────────────────────────────
// Cấu hình browser engine -- resize viewport và đồng bộ availWidth/availHeight
// vào file .ini của engine.
//
//   1. ConfigManager class -- sở hữu AsyncLock riêng (per-instance)
//   2. configure() -- đăng ký cleanup + resize viewport
//   3. synchronize() -- cập nhật availWidth/availHeight vào .ini
// ─────────────────────────────────────────────────────────────────────────────

import AsyncLock from 'async-lock';
import { setViewport } from './browser';
import { sleep } from '../common/timer';
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

const DEFAULT_POLL_INTERVAL = 500;
const MIN_POLL_INTERVAL = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate và clamp pollInterval về giá trị hợp lệ.
 * Âm hoặc NaN → default 500ms, < 100ms → clamp lên 100ms.
 * Dùng interval ngắn hơn giúp synchronize nhanh hơn (4s → 1s mặc định).
 */
const getValidPollInterval = (interval: number | undefined): number => {
  if (typeof interval !== 'number' || Number.isNaN(interval) || interval < 0) {
    return DEFAULT_POLL_INTERVAL;
  }
  return Math.max(interval, MIN_POLL_INTERVAL);
};

// ─── ConfigManager ────────────────────────────────────────────────────────────

/**
 * Quản lý cấu hình browser engine cho một instance.
 * Mỗi instance sở hữu AsyncLock riêng để tránh contention
 * khi nhiều instance gọi synchronize() song song.
 */
export class ConfigManager {
  #lock = new AsyncLock();

  /**
   * Cấu hình browser sau spawn -- đăng ký cleanup handler và resize viewport.
   * Dùng process.on('exit') thay vì browser event để đảm bảo dọn dẹp
   * ngay cả khi process bị kill.
   */
  async configure(
    cleanup: CleanupFn,
    browser: Browser,
    bounds: ConfigureOptions = {},
    sync: SyncWrapper = async (fn) => fn()
  ): Promise<void> {
    browser.process.once('exit', () => cleanup(browser));
    browser.configure = async (): Promise<void> => {
      if (bounds.width && bounds.height) {
        await sync(() => setViewport(browser, bounds as Required<ConfigureOptions>));
      }
    };
    await browser.configure();
  }

  /**
   * Đồng bộ availWidth/availHeight vào file .ini của engine.
   * Trước action: set BAS_NOT_SET (reset), sau action: set giá trị thật.
   * Dùng AsyncLock để tránh race condition khi nhiều instance cùng ghi.
   */
  async synchronize(
    id: string,
    pwd: string,
    bounds: ViewportBounds = {},
    action: ActionFn = async () => {},
    pollInterval?: number
  ): Promise<void> {
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
            const value = reset ? 'BAS_NOT_SET' : (bounds[boundsKey] ?? 'BAS_NOT_SET');
            return `${iniKey}=${value}`;
          });
        }
        await writeFile(configPath, configContent);
        await sleep(actualPollInterval);
      }
    });
  }
}
