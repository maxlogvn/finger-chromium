// ─── File: adapter/playwright/bridge.ts ────────────────────────────────────
// Bridge giữa FingerprintPlugin và Playwright BrowserType.
// Cho phép launch persistent context với fingerprint/proxy/profile.
//
//   1. Load Playwright module (mặc định hoặc custom)
//   2. Override launch/launchPersistentContext để inject fingerprint
//   3. Validate options không hỗ trợ (proxy, channel, firefoxUserPrefs)
//   4. Filter ignored Fluent arguments
// ─────────────────────────────────────────────────────────────────────────────

import type { BrowserContext, BrowserType, Page } from 'playwright-core';

import FingerprintPlugin, { type BaseLaunchOptions } from '../../plugin';
import type { Browser } from '@src/plugin/launcher';
import { PluginError } from '@src/plugin/errors';
import defaultLoader from './loader';
import { bindHooks, getViewport, onClose, setViewport } from './utils';
import type { Launcher, PluginLaunchOptions } from './fluent';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Các argument Fluent bị loại bỏ để tránh xung đột với fingerprint.
 * `--disable-extensions` bị loại vì extension có thể làm lộ dấu vết thực thi.
 */
export const IGNORED_ARGUMENTS = ['--disable-extensions'];

/**
 * Các option của Playwright không được hỗ trợ trong plugin này.
 * `proxy` và `channel` ảnh hưởng đến fingerprint, `firefoxUserPrefs` chỉ dành cho Firefox.
 */
export const UNSUPPORTED_OPTIONS = ['proxy', 'channel', 'firefoxUserPrefs'] as const;

/**
 * Cảnh báo khi người dùng gọi `launch()` thay vì `launchPersistentContext()`.
 * `launch()` không tạo profile persistent, do đó fingerprint không được inject đúng cách.
 */
export const LAUNCH_FALLBACK_WARNING = [
  '[Fingerprint] Phương thức "launch" tạm thời không được hỗ trợ trực tiếp.',
  'Nội bộ sẽ sử dụng "launchPersistentContext" thay thế.',
  'Khuyến nghị dùng "launchPersistentContext" trực tiếp để tránh tác dụng phụ.',
].join('\n');

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Tạo launcher mặc định từ playwright-core.
 * Dùng defaultLoader để tránh import cứng playwright-core (hỗ trợ ESM/CJS).
 */
function createDefaultLauncher(): Launcher {
  const browserType: BrowserType = defaultLoader.load();
  return {
    launch: browserType.launch.bind(browserType),
    launchPersistentContext: browserType.launchPersistentContext.bind(browserType),
  };
}

/**
 * Bridge kết nối FingerprintPlugin với Playwright.
 * Override launch/launchPersistentContext để inject fingerprint vào BrowserContext.
 *
 * **Tại sao không dùng `launch` trực tiếp?** Vì `launch` tạo context tạm thời,
 * không thể gắn fingerprint persistent. Bắt buộc dùng `launchPersistentContext`.
 */
export class PlaywrightFingerprintPlugin extends FingerprintPlugin {
  protected readonly pwLauncher: Launcher;

  /**
   * @param launcher - Tuỳ chọn launcher tuỳ chỉnh (dùng để test hoặc thay thế browser)
   */
  constructor(launcher?: Launcher) {
    super();
    this.pwLauncher = launcher ?? createDefaultLauncher();
  }

  /**
   * Launch browser -- fallback sang launchPersistentContext.
   *
   * **Tại sao fallback?** `launch` thuần không hỗ trợ fingerprint vì không có
   * user data dir persistent. Gọi `launchPersistentContext` với userDataDir rỗng
   * sẽ tạo context tạm nhưng vẫn inject được fingerprint.
   *
   * @param options - Tuỳ chọn launch (sẽ được validate)
   * @returns BrowserContext đã được inject fingerprint
   * @throws PluginError nếu options chứa UNSUPPORTED_OPTIONS
   */
  async launch(options: PluginLaunchOptions = {}): Promise<BrowserContext> {
    this.#validateOptions(options);
    console.warn(LAUNCH_FALLBACK_WARNING);
    return this.launchPersistentContext('', options);
  }

  /**
   * Launch persistent context -- inject fingerprint thông qua launcher proxy.
   *
   * **Tại sao filter `--user-data-dir`?** Vì `launchPersistentContext` tự động
   * thêm argument này dựa trên `userDataDir`. Nếu giữ lại argument do user truyền
   * sẽ gây conflict và có thể dẫn đến lỗi "user data directory already in use".
   *
   * @param userDataDir - Đường dẫn thư mục profile persistent
   * @param options - Tuỳ chọn launch (viewport, args, ...)
   * @returns BrowserContext đã được inject fingerprint
   * @throws PluginError nếu launcher thiếu phương thức `launchPersistentContext`
   */
  async launchPersistentContext(userDataDir: string, options: PluginLaunchOptions = {}): Promise<BrowserContext> {
    this.#validateOptions(options);
    const { ignoreDefaultArgs } = options;
    const method = 'launchPersistentContext' as const;

    if (!this.pwLauncher[method]) {
      throw new PluginError(`Launcher không hỗ trợ phương thức "${method}".`);
    }

    // --- Bước 1: Tạo launcher wrapper để filter user-data-dir
    // --- Bước 2: Gọi _launch của base class để inject fingerprint
    return this._launch(false, {
      ...options,
      userDataDir,
      viewport: null,
      launcher: {
        launch: async (opts: BaseLaunchOptions = {}) => {
          const filteredArgs = (opts.args ?? []).filter((arg: string) => !arg.startsWith('--user-data-dir'));
          return this.pwLauncher[method](userDataDir, { ...opts, args: filteredArgs }) as unknown as Browser;
        },
      } as unknown as { launch: (opts: BaseLaunchOptions) => Promise<Browser> },
      ignoreDefaultArgs: Array.isArray(ignoreDefaultArgs)
        ? ignoreDefaultArgs.concat(IGNORED_ARGUMENTS)
        : ignoreDefaultArgs || IGNORED_ARGUMENTS,
    }) as unknown as Promise<BrowserContext>;
  }

  /**
   * Cấu hình context sau khi spawn.
   *
   * **Tại sao cần `sync`?** Một số thao tác (resize viewport) cần được đồng bộ
   * để tránh race condition giữa fingerprint injection và page load.
   *
   * @param cleanup - Hàm dọn dẹp tài nguyên khi context đóng
   * @param browser - BrowserContext vừa được tạo
   * @param bounds - Kích thước viewport mong muốn (width, height)
   * @param sync - Hàm đồng bộ hoá các thao tác bất đồng bộ
   */
  async configure(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridge giữa 2 type system khác nhau
    cleanup: (target: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    browser: any,
    bounds: { width: number; height: number },
    sync: <T>(fn: () => Promise<T> | T) => Promise<T>
  ): Promise<void> {
    const context = browser as BrowserContext;

    // Đảm bảo cleanup được gọi khi context đóng
    onClose(context, () => cleanup(context));

    // Resize viewport nếu cần
    if (bounds.width && bounds.height) {
      const resize = async (page: Page) => {
        const { width, height } = await getViewport(page);
        if (width !== bounds.width || height !== bounds.height) {
          await sync(() => setViewport(page, bounds));
        }
      };

      bindHooks(context, { onPageCreated: resize });
      const [firstPage] = context.pages();
      if (firstPage) await resize(firstPage);
    }
  }

  /**
   * Kiểm tra options không chứa các tham số không hỗ trợ.
   *
   * @param options - Options cần kiểm tra
   * @throws PluginError nếu phát hiện option không hỗ trợ
   */
  #validateOptions(options: Record<string, unknown> = {}): void {
    for (const option of UNSUPPORTED_OPTIONS) {
      if (option in options) {
        throw new PluginError(`Option "${option}" không được hỗ trợ trong plugin này.`);
      }
    }
  }
}
