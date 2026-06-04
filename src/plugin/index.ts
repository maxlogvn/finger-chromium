// ─── File: plugin/index.ts ──────────────────────────────────────────────────
// Namespace quản lý vòng đời Fingerprint engine: cấu hình, spawn worker,
// gọi API fingerprint service.
//
//   1. Đăng ký cấu hình (fingerprint, proxy, profile, version) qua Fluent API
//   2. Gọi API service (fetch, versions) để lấy dữ liệu fingerprint
//   3. Spawn worker.exe -- _launch() thiết lập engine + browser process
//   4. Cấu hình browser sau spawn -- configure() + synchronize()
// ─────────────────────────────────────────────────────────────────────────────

import path from 'path';
import crypto from 'crypto';
import * as mutex from './mutex';
import { SettingsCleaner } from './cleaner';
import type { Browser, LaunchOptions as SpawnOptions } from './launcher';
import { launch } from './launcher';
import Connector from './connector';
import { ConfigManager } from './config';
import { defaultArgs, getProfilePath, validateConfig, validateLauncher } from './utils';
import type { Version } from 'chrome-remote-interface';
import type { FingerprintOptions } from '../types/fingerprint';
import type { ProfileOptions } from '../types/profile';
import type { ProxyOptions } from '../types/proxy';
import type { FetchOptions } from '../types/fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

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

/**
 * Tuỳ chọn khởi động browser mở rộng -- thêm key, launcher custom, viewport.
 * Kế thừa toàn bộ LaunchOptions từ launcher module.
 */
export interface BaseLaunchOptions extends SpawnOptions {
  launcher?: { launch: (opts: BaseLaunchOptions) => Promise<Browser> };
  key?: string;
  defaultViewport?: { width: number; height: number } | null;
  [key: string]: unknown;
}

// ─── Configuration Methods ────────────────────────────────────────────────────

/**
 * Plugin core fingerprint -- quản lý cấu hình, spawn worker, gọi API.
 * Sử dụng Fluent API: useFingerprint().useProxy().useProfile()... rồi spawn().
 */
export default class FingerprintPlugin {
  protected launcher: { launch: (opts: BaseLaunchOptions) => Promise<Browser> };
  protected version: string | null = 'default';
  protected fingerprint?: PluginConfig;
  protected profile?: PluginConfig;
  protected proxy?: PluginConfig;
  #cleaner = new SettingsCleaner();
  #connector = new Connector();
  #configManager = new ConfigManager();
  #serviceKey: string | undefined;
  protected browser?: Browser;
  protected processId?: string;

  /**
   * @param launcherInstance - Launcher tuỳ chỉnh, nếu không có thì dùng mặc định
   */
  constructor(launcherInstance?: { launch: (opts: BaseLaunchOptions) => Promise<Browser> }) {
    this.launcher =
      launcherInstance ?? ({ launch } as unknown as { launch: (opts: BaseLaunchOptions) => Promise<Browser> });
  }
  /**
   * Factory method -- validate launcher trước khi khởi tạo.
   *
   * @param launcherInstance - Launcher cần validate
   */
  static create(launcherInstance: { launch: (opts: BaseLaunchOptions) => Promise<Browser> }): FingerprintPlugin {
    validateLauncher(launcherInstance);
    return new FingerprintPlugin(launcherInstance);
  }

  /**
   * Gắn fingerprint cho browser -- data và tuỳ chọn làm nhiễu.
   *
   * @param value - Fingerprint data (JSON string)
   * @param options - PerfectCanvas, WebGL, Audio, Canvas noise...
   */
  useFingerprint(value = '', options: FingerprintOptions = {}): this {
    validateConfig('fingerprint', value, options);
    this.fingerprint = { value, options };
    return this;
  }

  /**
   * Liên kết profile -- thư mục chứa cookie, localStorage, dữ liệu trình duyệt.
   *
   * @param value - Đường dẫn thư mục profile
   * @param options - loadProxy, loadFingerprint từ profile cũ
   */
  useProfile(value = '', options: ProfileOptions = {}): this {
    validateConfig('profile', value, options);
    this.profile = { value, options };
    return this;
  }

  /**
   * Định tuyến traffic qua proxy -- HTTP/HTTPS/SOCKS4/SOCKS5.
   *
   * @param value - URL proxy (vd: http://user:pass@host:port)
   * @param options - timezone, geolocation, WebRTC, DNS...
   */
  useProxy(value = '', options: ProxyOptions = {}): this {
    validateConfig('proxy', value, options);
    this.proxy = { value, options };
    return this;
  }

  /**
   * Chọn phiên bản browser engine -- 'default' hoặc version cụ thể.
   *
   * @param version - Tên version (vd: '120', 'stable')
   */
  useBrowserVersion(version: string): this {
    this.version = version || 'default';
    return this;
  }

  /**
   * Trích xuất proxy từ command-line arguments -- fallback nếu useProxy chưa được gọi.
   * Dùng khi launch từ Playwright có truyền --proxy-server.
   *
   * @param args - Mảng arguments từ LaunchOptions
   */
  public setProxyFromArguments(args: string[] = []): this {
    if (this.proxy == null) {
      for (const arg of args) if (arg.includes('--proxy-server')) return this.useProxy(arg.slice(15));
    }
    return this;
  }

  /**
   * Đặt thư mục làm việc cho engine -- nơi giải nén và chạy worker.
   *
   * @param folder - Đường dẫn tuyệt đối
   */
  setWorkingFolder(folder: string): void {
    this.#connector.setCwd(path.resolve(folder));
  }

  /**
   * Timeout cho mỗi request API (mặc định: 0 = không timeout).
   *
   * @param timeout - Thời gian timeout (ms)
   */
  setRequestTimeout(timeout: number): void {
    this.#connector.setRequestTimeout(timeout || 0);
  }

  /**
   * Timeout khởi động engine -- nếu quá lâu coi như lỗi.
   *
   * @param timeout - Thời gian timeout (ms)
   */
  setEngineTimeout(timeout: number): void {
    this.#connector.setEngineTimeout(timeout || 0);
  }

  /**
   * Gán private key -- dùng cho API fetch/versions và setup engine.
   *
   * @param key - Key từ bablosoft.com
   */
  setServiceKey(key: string): void {
    this.#serviceKey = key;
  }

  // ─── Runtime ──────────────────────────────────────────────────────────────

  /**
   * Lấy fingerprint từ service -- kết quả là JSON string chứa fingerprint data.
   *
   * @param options - Bộ lọc (tags, time, quantity...)
   * @returns JSON string fingerprint
   */
  async fetch(options: FetchOptions = {}): Promise<string> {
    return (await this.#connector.api('fetch', {
      key: this.#serviceKey,
      options,
      version: this.version,
    } as any)) as string;
  }

  /**
   * Danh sách browser version có sẵn -- default trả về string[], extended trả về Version[].
   *
   * @param format - 'default' | 'extended'
   * @returns Danh sách version
   */
  async versions<T extends 'default' | 'extended' = 'default'>(
    format: T = 'default' as T
  ): Promise<T extends 'extended' ? Version[] : string[]> {
    return (await this.#connector.api('versions', { format })) as any;
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────

  /**
   * Khởi động browser -- spawn worker.exe với cấu hình đã đăng ký.
   *
   * @param options - LaunchOptions (args, headless, proxy...)
   * @returns Browser instance
   */
  async spawn(options: BaseLaunchOptions = {}): Promise<Browser> {
    return this._launch(true, options);
  }

  protected async configure(..._args: any[]): Promise<void> {
    if (typeof this.#configManager.configure === 'function') return (this.#configManager.configure as any)(..._args);
  }

  protected async _launch(useDefaultLauncher: boolean, options: BaseLaunchOptions = {}): Promise<Browser> {
    // --- Bước 1: Trích xuất proxy từ arguments nếu chưa set qua useProxy()
    this.setProxyFromArguments(options.args || []);

    // --- Bước 2: Gọi API setup -- engine khởi tạo profile, fingerprint, proxy
    const setupData = (await this.#connector.api('setup', {
      proxy: this.proxy,
      fingerprint: this.fingerprint,
      version: this.version,
      profile: this.profile ?? {
        value: getProfilePath(options as any),
        options: { loadProxy: true, loadFingerprint: true },
      },
      pid: crypto.randomUUID(),
      key: typeof options.key === 'string' ? options.key : this.#serviceKey,
    } as any)) as SetupResponse;
    const { id, pid, pwd, path: browserPath, bounds, ...config } = setupData;
    this.processId = pid;

    // --- Bước 3: Đăng ký cleaner + tạo mutex -- dọn dẹp khi process kết thúc
    await this.#cleaner.watch(pwd).ignore(pwd, pid, id);
    mutex.create(`BASProcess${pid}`);

    // --- Bước 4: Chọn launcher -- mặc định (spawn) hoặc custom (plugin bridge)
    const activeLauncher = useDefaultLauncher
      ? ({ launch } as unknown as { launch: (opts: BaseLaunchOptions) => Promise<Browser> })
      : (options.launcher ?? this.launcher);

    // --- Bước 5: Spawn worker.exe -- headless: false vì fingerprint check phát hiện headless
    const browser = await activeLauncher.launch({
      ...options,
      headless: false,
      userDataDir: undefined,
      defaultViewport: undefined,
      executablePath: `${browserPath}/worker.exe`,
      args: [`--parent-process-id=${pid}`, `--unique-process-id=${id}`, ...defaultArgs({ ...options, ...config })],
    } as any);
    this.browser = browser;

    // --- Bước 6: Cấu hình và đồng bộ -- inject fingerprint, proxy vào browser
    const configFn = useDefaultLauncher ? this.#configManager.configure.bind(this.#configManager) : this.configure.bind(this);
    await configFn(() => this.#cleaner.include(pwd, pid, id), browser, bounds, this.#configManager.synchronize.bind(this.#configManager, id, pwd, bounds));
    return browser;
  }

  /**
   * Dọn dẹp tài nguyên -- kill browser process, engine, cleaner, mutex.
   * Thứ tự: browser trước (worker.exe), connector (engine) sau, cleaner cuối cùng.
   * PCAP server không bị đóng vì là singleton dùng chung cho cả process.
   */
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

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Singleton plugin instance -- dùng cho Playwright bridge.
 * Được khởi tạo với launcher mặc định (spawn worker.exe).
 */
export const plugin = new FingerprintPlugin();
