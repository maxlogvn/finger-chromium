import path from 'node:path';
import { PlaywrightFingerprintPlugin } from './engine';
import { AdapterDataManager } from './data';

import type { BrowserContext, BrowserType } from 'playwright-core';
import type { PWChromium } from '../../types/PWChromium';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { ProfileOptions } from '../../types/profile';
import type { FingerprintOptions } from '../../types/fingerprint';
import type { ProxyOptions } from '../../types/proxy';
import type { FetchOptions } from 'src/types/fetch';

export type { ProfileOptions, FingerprintOptions, ProxyOptions, FetchOptions };
export type PluginLaunchOptions = Parameters<BrowserType['launchPersistentContext']>[1];
export type Launcher = Pick<BrowserType, 'launch' | 'launchPersistentContext'>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const PRIVATE_KEY = process.env.BABLOSOFT_KEY ?? '';
export const BROWSER_RUNNING_DIR = path.join(process.cwd(), process.env.BROWSER_RUNNING_DIR ?? '.tmp/browser/running');
export const ENGINE_WORKING_DIR = path.join(process.cwd(), process.env.ENGINE_WORKING_DIR ?? '.tmp/browser/engine');

export const DEFAULT_CONTEXT_OPTIONS: PluginLaunchOptions = {
  headless: false,
  hasTouch: true,
};

// ─── BrowserEngine ────────────────────────────────────────────────────────────

class BrowserEngine implements PWChromium {
  public engine: PlaywrightFingerprintPlugin;

  private options: PluginLaunchOptions;
  private privateKey: string;
  private readonly engineWorkingDirPath: string;
  private readonly dataManager: AdapterDataManager;

  // ─── Profile ──────────────────────────────────────────────────────────────

  private saveProfileDirPath?: string;
  private profileData: [string, ProfileOptions?];

  // ─── Runtime ──────────────────────────────────────────────────────────────

  private context?: BrowserContext;
  private isLaunched = false;
  private fingerprints?: [string, FingerprintOptions?];
  private proxyData?: [string, ProxyOptions?];

  constructor() {
    this.engine = new PlaywrightFingerprintPlugin();
    this.options = { ...DEFAULT_CONTEXT_OPTIONS };
    this.privateKey = PRIVATE_KEY;
    this.engineWorkingDirPath = ENGINE_WORKING_DIR;
    this.dataManager = new AdapterDataManager();
    this.profileData = [path.join(BROWSER_RUNNING_DIR, 'profile')];
  }

  // ─── Configuration Methods ────────────────────────────────────────────────

  repackChromium(launcher: Launcher): this {
    this.engine = new PlaywrightFingerprintPlugin(launcher);
    console.warn('[BrowserEngine] Nen su dung trinh duyet duoc patch mac dinh de dam bao tinh an danh.');
    return this;
  }

  useFingerprint(data: string, options?: FingerprintOptions): this {
    this.fingerprints = [data, options];
    return this;
  }

  useProxy(data: string, options?: ProxyOptions): this {
    this.proxyData = [data, options];
    return this;
  }

  useProfile(dirPath: string, options?: ProfileOptions): this {
    this.saveProfileDirPath = dirPath;
    this.profileData = [this.dataManager.map(dirPath), options];
    return this;
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────

  launch(options: Partial<PluginLaunchOptions> = {}): this {
    if (this.isLaunched) {
      throw new Error('[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan.');
    }

    this.options = { ...this.options, ...options };

    this.engine.setServiceKey(this.privateKey);
    this.engine.setWorkingFolder(this.engineWorkingDirPath);
    this.engine.useProfile(...this.profileData);

    if (this.proxyData) this.engine.useProxy(...this.proxyData);
    if (this.fingerprints) this.engine.useFingerprint(...this.fingerprints);

    this.isLaunched = true;
    return this;
  }

  async newContext(options: Partial<PluginLaunchOptions> = {}): Promise<BrowserContext> {
    if (!this.isLaunched) {
      throw new Error('[BrowserEngine] Phai goi launch() truoc khi tao context.');
    }
    if (this.context) {
      throw new Error('[BrowserEngine] Context da duoc tao. Vui long goi quit() truoc khi tao moi.');
    }

    this.options = { ...this.options, ...options };
    this.context = await this.engine.launchPersistentContext(this.profileData[0], this.options);
    return this.context;
  }
  async newFingerprint(options: FetchOptions | undefined) {
    return await this.engine.fetch(options);
  }

  async quit(saveDataPath?: string): Promise<void> {
    if (!this.isLaunched) return;

    if (this.context) {
      await this.context.close();
      this.context = undefined;

      const targetSavePath = saveDataPath ?? this.saveProfileDirPath;
      if (targetSavePath) {
        this.dataManager.map(this.profileData[0], targetSavePath);
      }
    }

    this.dataManager.unmap(BROWSER_RUNNING_DIR);
    this.isLaunched = false;
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Namespace điều khiển trình duyệt Chromium.
 *
 * @example
 * const browser = Chromium.launch()
 *   .useFingerprint(fp)
 *   .useProxy('http://user:pass@host:port')
 *   .useProfile('./profiles/user_01');
 *
 * const context = await browser.newContext();
 * await browser.quit();
 */
const Chromium: PWChromium = new BrowserEngine();

export { Chromium };
