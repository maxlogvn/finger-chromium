// ─── File: fluent.ts ──────────────────────────────────────────────────────
// Điều khiển trình duyệt với hỗ trợ fingerprint, proxy và profile.
//
//   const engine = await new BrowserEngine()
//     .useFingerprint(data)
//     .useProxy(proxy)
//     .useProfile(dirPath)
//     .launch();
//
//   const context = await engine.newContext();
//   await engine.close();
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

import path from 'node:path';
import type { BrowserContext, BrowserType } from 'playwright-core';

import { PlaywrightFingerprintPlugin } from './bridge';
import { AdapterDataManager } from './data';
import { PluginError } from '@src/plugin/errors';
import { collectErrors } from './utils';
import type { PWChromium } from '@src/types/PWChromium';
import type { FetchOptions } from '@src/types/fetch';
import type { FingerprintOptions } from '@src/types/fingerprint';
import type { ProfileOptions } from '@src/types/profile';
import type { ProxyOptions } from '@src/types/proxy';
import type Connector from '../../plugin/connector';

export type { ProfileOptions, FingerprintOptions, ProxyOptions, FetchOptions };

// ─── Types ────────────────────────────────────────────────────────────────────

export type PluginLaunchOptions = Parameters<BrowserType['launchPersistentContext']>[1];
export type Launcher = Pick<BrowserType, 'launch' | 'launchPersistentContext'>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const PRIVATE_KEY = process.env.BABLOSOFT_KEY ?? '';
export const ENGINE_WORKING_DIR = path.join(process.cwd(), process.env.ENGINE_WORKING_DIR ?? '.tmp/browser/engine');
export const BROWSER_RUNNING_DIR = path.join(process.cwd(), process.env.BROWSER_RUNNING_DIR ?? '.tmp/browser/running');
export const DEFAULT_PROFILE_DIR = path.join(process.cwd(), 'data', 'profiles', 'default');
export const DEFAULT_CONTEXT_OPTIONS: PluginLaunchOptions = {
  headless: false,
  hasTouch: true,
};
export const DEFAULT_FINGERPRINT_OPTIONS: FetchOptions = {
  tags: ['Microsoft Windows', 'Chrome'],
};

// ─── BrowserEngine ────────────────────────────────────────────────────────────

export class BrowserEngine implements PWChromium {
  private launcher?: Launcher;
  private connector?: Connector;
  private fingerprintData?: [string, FingerprintOptions?];
  private proxyData?: [string, ProxyOptions?];
  private profileDirPath?: string;
  private saveProfileDirPath?: string;
  private profileOptions?: ProfileOptions;

  // Khởi tạo lazy trong launch() -- undefined trước khi launch()
  private _engine!: PlaywrightFingerprintPlugin;
  private dataManager!: AdapterDataManager;
  private launchOptions: PluginLaunchOptions = { ...DEFAULT_CONTEXT_OPTIONS };
  private profileData!: [string, ProfileOptions?];
  private context?: BrowserContext;
  private isLaunched = false;
  private contextCreating = false;

  // ─── Static shortcuts ──────────────────────────────────────────────────────

  /**
   * Fetch một fingerprint mới độc lập, không cần tạo BrowserEngine đầy đủ.
   * Engine tạm được cleanup tự động sau khi fetch xong.
   */
  static async newFingerprint(options: FetchOptions = DEFAULT_FINGERPRINT_OPTIONS): Promise<string> {
    const engine = new PlaywrightFingerprintPlugin();
    engine.setServiceKey(PRIVATE_KEY);
    engine.setWorkingFolder(ENGINE_WORKING_DIR);
    return engine.fetch(options);
  }

  // ─── Fluent config ─────────────────────────────────────────────────────────

  useFingerprint(data: string, options?: FingerprintOptions): this {
    this.fingerprintData = [data, options];
    return this;
  }

  useProxy(data: string, options?: ProxyOptions): this {
    this.proxyData = [data, options];
    return this;
  }

  /**
   * Đặt thư mục profile để đọc khi khởi động.
   * Mặc định cũng lưu về đây khi close().
   * Để lưu sang nơi khác, truyền path vào close(saveDataPath).
   */
  useProfile(dirPath: string, options?: ProfileOptions): this {
    this.profileDirPath = dirPath;
    this.saveProfileDirPath = dirPath;
    this.profileOptions = options;
    return this;
  }

  useLauncher(launcher: Launcher, connector?: Connector): this {
    this.launcher = launcher;
    this.connector = connector;
    return this;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Khởi tạo engine và apply toàn bộ config.
   * Phải gọi trước newContext(). Chỉ được gọi một lần.
   */
  launch(options: Partial<PluginLaunchOptions> = {}): this {
    if (this.isLaunched) {
      throw new PluginError('[BrowserEngine] launch() chỉ được gọi một lần.');
    }

    // Khởi tạo nội bộ -- lazy, chỉ xảy ra ở đây
    this._engine = new PlaywrightFingerprintPlugin(this.launcher, this.connector);
    this.dataManager = new AdapterDataManager();
    this.launchOptions = { ...DEFAULT_CONTEXT_OPTIONS, ...options };

    const profileDir = this.profileDirPath ?? DEFAULT_PROFILE_DIR;
    this.saveProfileDirPath ??= profileDir;
    const profilePath = this.dataManager.map(profileDir);
    this.profileData = [profilePath, this.profileOptions];

    this._engine.setServiceKey(PRIVATE_KEY);
    this._engine.setWorkingFolder(ENGINE_WORKING_DIR);
    this._engine.useProfile(...this.profileData);
    if (this.proxyData) this._engine.useProxy(...this.proxyData);
    if (this.fingerprintData) this._engine.useFingerprint(...this.fingerprintData);

    this.isLaunched = true;
    return this;
  }

  /**
   * Tạo BrowserContext mới. Phải gọi launch() trước.
   * Mỗi instance chỉ giữ một context -- gọi close() trước khi tạo context mới.
   */
  async newContext(options: Partial<PluginLaunchOptions> = {}): Promise<BrowserContext> {
    if (!this.isLaunched) {
      throw new PluginError('[BrowserEngine] Phải gọi launch() trước khi tạo context.');
    }
    if (this.context) {
      throw new PluginError('[BrowserEngine] Context đã được tạo. Gọi close() trước khi tạo mới.');
    }
    if (this.contextCreating) {
      throw new PluginError('[BrowserEngine] Đang tạo context, không được gọi đồng thời.');
    }

    this.contextCreating = true;
    try {
      const mergedOptions = { ...this.launchOptions, ...options };
      this.context = await this._engine.launchPersistentContext(this.profileData[0], mergedOptions);
      return this.context;
    } finally {
      this.contextCreating = false;
    }
  }

  /**
   * Đóng context, lưu profile nếu cần, dọn dẹp engine.
   * An toàn khi gọi nhiều lần -- lần thứ hai trở đi là no-op.
   */
  async close(saveDataPath?: string): Promise<void> {
    if (!this.isLaunched) return;
    this.isLaunched = false;

    const ctx = this.context;
    this.context = undefined;

    const targetSavePath = saveDataPath ?? this.saveProfileDirPath;

    const errs = await collectErrors(
      ['close-context', () => ctx?.close()],
      [
        'save-profile',
        () => {
          if (targetSavePath) this.dataManager.map(this.profileData[0], targetSavePath);
        },
      ],
      ['cleanup-engine', () => this._engine.cleanup()],
      ['dispose-data', () => this.dataManager.dispose()]
    );

    if (errs.length) throw new PluginError(`[BrowserEngine] close() failed:\n${errs.join('\n')}`);
  }
}
