// ─── File: adapter/playwright/engine.ts ────────────────────────────────────
// Bridge giữa FingerprintPlugin và Playwright BrowserType.
// Cho phép launch persistent context với fingerprint/proxy/profile.
//
//   1. Load Playwright module (mặc định hoặc custom)
//   2. override launch/launchPersistentContext để inject fingerprint
//   3. Validate options không hỗ trợ (proxy, channel, firefoxUserPrefs)
//   4. Filter ignored Chromium arguments
// ─────────────────────────────────────────────────────────────────────────────

import type { BrowserContext, BrowserType, Page } from 'playwright-core';
import FingerprintPlugin from '../../plugin';
import defaultLoader from './loader';
import { PluginError } from '../../plugin/errors';
import { bindHooks, getViewport, onClose, setViewport } from './utils';
import type { Launcher, PluginLaunchOptions } from './chromium';

// ─── Constants ────────────────────────────────────────────────────────────────

export const IGNORED_ARGUMENTS = ['--disable-extensions'];

export const UNSUPPORTED_OPTIONS = ['proxy', 'channel', 'firefoxUserPrefs'] as const;

export const LAUNCH_FALLBACK_WARNING = [
  '[Fingerprint] Phương thức "launch" tạm thời không được hỗ trợ trực tiếp.',
  'Nội bộ sẽ sử dụng "launchPersistentContext" thay thế.',
  'Khuyến nghị dùng "launchPersistentContext" trực tiếp để tránh tác dụng phụ.',
].join('\n');

function createDefaultLauncher(): Launcher {
  const browserType: BrowserType = defaultLoader.load();
  return {
    launch: browserType.launch.bind(browserType),
    launchPersistentContext: browserType.launchPersistentContext.bind(browserType),
  };
}

// ─── PlaywrightFingerprintPlugin ──────────────────────────────────────────────

/**
 * Bridge kết nối FingerprintPlugin với Playwright.
 * Override launch/launchPersistentContext để inject fingerprint vào BrowserContext.
 */
export class PlaywrightFingerprintPlugin extends FingerprintPlugin {
  protected readonly pwLauncher: Launcher;

  constructor(launcher?: Launcher) {
    super();
    this.pwLauncher = launcher ?? createDefaultLauncher();
  }

  /**
   * Launch browser -- fallback sang launchPersistentContext vì launch thuần không hỗ trợ fingerprint.
   */
  async launch(options: PluginLaunchOptions = {}): Promise<BrowserContext> {
    this.#validateOptions(options);
    console.warn(LAUNCH_FALLBACK_WARNING);
    return this.launchPersistentContext('', options);
  }

  /**
   * Launch persistent context -- inject fingerprint thông qua launcher proxy.
   * Filter user-data-dir argument để tránh xung đột với profile của engine.
   */
  async launchPersistentContext(userDataDir: string, options: PluginLaunchOptions = {}): Promise<BrowserContext> {
    this.#validateOptions(options);
    const { ignoreDefaultArgs } = options;
    const method = 'launchPersistentContext' as const;
    if (!this.pwLauncher[method]) throw new PluginError(`Launcher không hỗ trợ phương thức "${method}".`);

    return this._launch(false, {
      ...options,
      userDataDir,
      viewport: null,
      launcher: {
        launch: async (opts: any = {}) => {
          const filteredArgs = (opts.args ?? []).filter((arg: string) => !arg.startsWith('--user-data-dir'));
          return this.pwLauncher[method](userDataDir, { ...opts, args: filteredArgs });
        },
      } as any,
      ignoreDefaultArgs: Array.isArray(ignoreDefaultArgs)
        ? ignoreDefaultArgs.concat(IGNORED_ARGUMENTS)
        : ignoreDefaultArgs || IGNORED_ARGUMENTS,
    }) as unknown as Promise<BrowserContext>;
  }

  /**
   * Cấu hình context sau spawn -- đăng ký cleanup, resize viewport, bind hooks.
   */
  async configure(
    cleanup: (target: any) => void,
    browser: any,
    bounds: { width: number; height: number },
    sync: (fn: () => Promise<void>) => Promise<void>
  ): Promise<void> {
    const context = browser as BrowserContext;
    onClose(context, () => cleanup(context));
    if (bounds.width && bounds.height) {
      const resize = async (page: Page) => {
        const { width, height } = await getViewport(page);
        if (width !== bounds.width || height !== bounds.height) await sync(() => setViewport(page, bounds));
      };
      bindHooks(context, { onPageCreated: resize });
      const [firstPage] = context.pages();
      if (firstPage) await resize(firstPage);
    }
  }

  #validateOptions(options: Record<string, unknown> = {}): void {
    for (const option of UNSUPPORTED_OPTIONS) {
      if (option in options) throw new PluginError(`Option "${option}" không được hỗ trợ trong plugin này.`);
    }
  }
}
