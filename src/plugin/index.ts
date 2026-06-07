// ─── File: index.ts ──────────────────────────────────────────────────────
// Plugin chính – FingerprintPlugin – quản lý vòng đời fingerprint + browser.
//
//   1. Khởi tạo connector và launcher
//   2. Cấu hình fingerprint / profile / proxy / version
//   3. Fetch fingerprint từ service
//   4. Spawn browser với BAS engine
//   5. Cleanup tài nguyên
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import path from 'path';
import crypto from 'crypto';

import type { Version } from 'chrome-remote-interface';

import { ConfigManager } from './config';
import { SettingsCleaner } from './cleaner';
import * as mutex from './mutex';
import type { Browser, LaunchOptions as SpawnOptions } from './launcher';
import { launch } from './launcher';
import Connector from './connector';
import { defaultArgs, getProfilePath, validateConfig, validateLauncher } from './utils';

import type { FetchOptions } from '../types/fetch';
import type { FingerprintOptions } from '../types/fingerprint';
import type { ProfileOptions } from '../types/profile';
import type { ProxyOptions } from '../types/proxy';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ViewportBounds {
  width?: number;
  height?: number;
  [key: string]: number | undefined;
}
interface SetupResponse {
  id: string;
  pid: string;
  pwd: string;
  path: string;
  bounds: ViewportBounds;
  [key: string]: unknown;
}
interface PluginConfig {
  value: string;
  options: FingerprintOptions | ProfileOptions | ProxyOptions;
}

export interface BaseLaunchOptions extends Omit<SpawnOptions, 'executablePath'> {
  executablePath?: string;
  launcher?: {
    launch: (opts: BaseLaunchOptions) => Promise<Browser>;
  };
  key?: string;
  defaultViewport?: {
    width: number;
    height: number;
  } | null;
  [key: string]: unknown;
}

// ─── FingerprintPlugin ───────────────────────────────────────────────────────

export default class FingerprintPlugin {
  protected launcher: {
    launch: (opts: BaseLaunchOptions) => Promise<Browser>;
  };
  protected version: string | null = 'default';
  protected fingerprint?: PluginConfig;
  protected profile?: PluginConfig;
  protected proxy?: PluginConfig;
  #cleaner = new SettingsCleaner();
  #connector!: Connector;
  #configManager = new ConfigManager();
  #serviceKey: string | undefined;
  protected browser?: Browser;
  protected processId?: string;

  constructor(launcherInstance?: {
    launch: (opts: BaseLaunchOptions) => Promise<Browser>;
  }, connector?: Connector) {
    this.#connector = connector ?? new Connector();
    this.launcher = launcherInstance ?? {
      launch
    } as unknown as {
      launch: (opts: BaseLaunchOptions) => Promise<Browser>;
    };
  }

  static create(launcherInstance: {
    launch: (opts: BaseLaunchOptions) => Promise<Browser>;
  }): FingerprintPlugin {
    validateLauncher(launcherInstance);
    return new FingerprintPlugin(launcherInstance);
  }

  // ─── Configuration Methods ─────────────────────────────────────────────────

  useFingerprint(value = '', options: FingerprintOptions = {}): this {
    validateConfig('fingerprint', value, options);
    this.fingerprint = {
      value,
      options
    };
    return this;
  }

  useProfile(value = '', options: ProfileOptions = {}): this {
    validateConfig('profile', value, options);
    this.profile = {
      value,
      options
    };
    return this;
  }

  useProxy(value = '', options: ProxyOptions = {}): this {
    validateConfig('proxy', value, options);
    this.proxy = {
      value,
      options
    };
    return this;
  }

  useBrowserVersion(version: string): this {
    this.version = version || 'default';
    return this;
  }

  public setProxyFromArguments(args: string[] = []): this {
    if (this.proxy == null) {
      for (const arg of args) if (arg.includes('--proxy-server')) return this.useProxy(arg.slice(15));
    }
    return this;
  }

  setWorkingFolder(folder: string): void {
    this.#connector.setCwd(path.resolve(folder));
  }

  setRequestTimeout(timeout: number): void {
    this.#connector.setRequestTimeout(timeout || 0);
  }

  setEngineTimeout(timeout: number): void {
    this.#connector.setEngineTimeout(timeout || 0);
  }

  setServiceKey(key: string): void {
    this.#serviceKey = key;
  }

  // ─── Fetch Methods ─────────────────────────────────────────────────────────

  async fetch(options: FetchOptions = {}): Promise<string> {
    return (await this.#connector.api('fetch', {
      key: this.#serviceKey,
      options,
      version: this.version
    })) as string;
  }

  async versions<T extends 'default' | 'extended' = 'default'>(format: T = 'default' as T): Promise<T extends 'extended' ? Version[] : string[]> {
    return (await this.#connector.api('versions', {
      format
    })) as unknown as T extends 'extended' ? Version[] : string[];
  }

  // ─── Lifecycle Methods ─────────────────────────────────────────────────────

  async spawn(options: BaseLaunchOptions = {}): Promise<Browser> {
    return this._launch(true, options);
  }

  protected async configure(cleanup: () => void | Promise<void>, browser: Browser, bounds?: {
    width?: number;
    height?: number;
  }, sync?: <T>(fn: () => Promise<T> | T) => Promise<T>): Promise<void> {
    if (typeof this.#configManager.configure === 'function') return this.#configManager.configure(cleanup, browser, bounds, sync);
  }

  protected async _launch(useDefaultLauncher: boolean, options: BaseLaunchOptions = {}): Promise<Browser> {
    this.setProxyFromArguments(options.args || []);
    const setupData = (await this.#connector.api('setup', {
      proxy: this.proxy,
      fingerprint: this.fingerprint,
      version: this.version,
      profile: this.profile ?? {
        value: getProfilePath(options),
        options: {
          loadProxy: true,
          loadFingerprint: true
        }
      },
      pid: crypto.randomUUID(),
      key: typeof options.key === 'string' ? options.key : this.#serviceKey
    })) as SetupResponse;
    const {
      id,
      pid,
      pwd,
      path: browserPath,
      bounds,
      ...config
    } = setupData;
    this.processId = pid;
    await this.#cleaner.watch(pwd).ignore(pwd, pid, id);
    mutex.create(`BASProcess${pid}`);
    const activeLauncher = useDefaultLauncher ? {
      launch
    } as unknown as {
      launch: (opts: BaseLaunchOptions) => Promise<Browser>;
    } : options.launcher ?? this.launcher;
    const launchOpts: BaseLaunchOptions = {
      ...options,
      headless: false,
      userDataDir: undefined,
      defaultViewport: undefined,
      executablePath: `${browserPath}/worker.exe`,
      args: [`--parent-process-id=${pid}`, `--unique-process-id=${id}`, ...defaultArgs({
        ...options,
        ...config
      })]
    };
    const browser = await activeLauncher.launch(launchOpts);
    this.browser = browser;
    type ConfigFn = (cleanup: () => void | Promise<void>, browser: Browser, bounds?: {
      width?: number;
      height?: number;
    }, sync?: (fn: () => Promise<void>) => Promise<void>) => Promise<void>;
    const configFn: ConfigFn = useDefaultLauncher ? this.#configManager.configure.bind(this.#configManager) as unknown as ConfigFn : this.configure.bind(this) as ConfigFn;
    await configFn(() => this.#cleaner.include(pwd, pid, id), browser, bounds, this.#configManager.synchronize.bind(this.#configManager, id, pwd, bounds));
    return browser;
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = undefined;
    }
    await this.#connector.cleanup();
    if (this.processId) {
      mutex.release(`BASProcess${this.processId}`);
    }
    await this.#cleaner.stop();
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const plugin = new FingerprintPlugin();