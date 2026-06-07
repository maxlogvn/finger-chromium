// ─── File: bridge.ts ─────────────────────────────────────────────────────
// Bridge giữa Playwright và FingerprintPlugin – tích hợp fingerprint vào Playwright context.
//
//   1. Tạo default launcher từ playwright
//   2. launchPersistentContext – spawn browser với fingerprint config
//   3. configure – set viewport, bind resize hooks
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import type { BrowserContext, BrowserType, Page } from 'playwright-core';

import FingerprintPlugin, { type BaseLaunchOptions } from '../../plugin';
import type Connector from '../../plugin/connector';
import type { Browser } from '@src/plugin/launcher';
import { PluginError } from '@src/plugin/errors';

import defaultLoader from './loader';
import { bindHooks, getViewport, onClose, setViewport } from './utils';
import type { Launcher, PluginLaunchOptions } from './fluent';

// ─── Constants ───────────────────────────────────────────────────────────────

export const IGNORED_ARGUMENTS = ['--disable-extensions'];
export const UNSUPPORTED_OPTIONS = ['proxy', 'channel', 'firefoxUserPrefs'] as const;
export const LAUNCH_FALLBACK_WARNING = ['[Fingerprint] Phương thức "launch" tạm thời không được hỗ trợ trực tiếp.', 'Nội bộ sẽ sử dụng "launchPersistentContext" thay thế.', 'Khuyến nghị dùng "launchPersistentContext" trực tiếp để tránh tác dụng phụ.'].join('\n');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createDefaultLauncher(): Launcher {
  const browserType = defaultLoader.load() as BrowserType;
  return {
    launch: browserType.launch.bind(browserType),
    launchPersistentContext: browserType.launchPersistentContext.bind(browserType)
  };
}

// ─── PlaywrightFingerprintPlugin ─────────────────────────────────────────────

export class PlaywrightFingerprintPlugin extends FingerprintPlugin {
  protected readonly pwLauncher: Launcher;

  constructor(launcher?: Launcher, connector?: Connector) {
    super(undefined, connector);
    this.pwLauncher = launcher ?? createDefaultLauncher();
  }

  async launch(options: PluginLaunchOptions = {}): Promise<BrowserContext> {
    this.#validateOptions(options);
    console.warn(LAUNCH_FALLBACK_WARNING);
    return this.launchPersistentContext('', options);
  }

  async launchPersistentContext(userDataDir: string, options: PluginLaunchOptions = {}): Promise<BrowserContext> {
    this.#validateOptions(options);
    const {
      ignoreDefaultArgs
    } = options;
    const method = 'launchPersistentContext' as const;
    return this._launch(false, {
      ...options,
      userDataDir,
      viewport: null,
      launcher: {
        launch: (opts: BaseLaunchOptions = {}) => {
          const filteredArgs = (opts.args ?? []).filter((arg: string) => !arg.startsWith('--user-data-dir'));
          return this.pwLauncher[method](userDataDir, {
            ...opts,
            args: filteredArgs
          }) as unknown as Browser;
        }
      } as unknown as {
        launch: (opts: BaseLaunchOptions) => Promise<Browser>;
      },
      ignoreDefaultArgs: Array.isArray(ignoreDefaultArgs) ? ignoreDefaultArgs.concat(IGNORED_ARGUMENTS) : ignoreDefaultArgs || IGNORED_ARGUMENTS
    }) as unknown as Promise<BrowserContext>;
  }

  async configure(
    cleanup: (target: unknown) => void,
    browser: unknown, bounds: {
      width: number;
      height: number;
    }, sync: <T>(fn: () => Promise<T> | T) => Promise<T>
  ): Promise<void> {
    const context = browser as BrowserContext;
    onClose(context, () => { cleanup(context); });
    if (bounds.width && bounds.height) {
      const resize = async (page: Page) => {
        const {
          width,
          height
        } = await getViewport(page);
        if (width !== bounds.width || height !== bounds.height) {
          await sync(() => setViewport(page, bounds));
        }
      };
      bindHooks(context, {
        onPageCreated: resize
      });
      const [firstPage] = context.pages();
      await resize(firstPage);
    }
  }

  #validateOptions(options: Record<string, unknown> = {}): void {
    for (const option of UNSUPPORTED_OPTIONS) {
      if (option in options) {
        throw new PluginError(`Option "${option}" không được hỗ trợ trong plugin này.`);
      }
    }
  }
}