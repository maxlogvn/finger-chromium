// ─── File: plugin/index.ts ──────────────────────────────────────────────────
// Namespace quản lý vòng đời Fingerprint engine: cấu hình, spawn worker,
// gọi API fingerprint service.
//
//   Việc tách cấu hình khỏi runtime cho phép tái sử dụng cùng bộ fingerprint/proxy
//   trên nhiều browser mà không cần gọi lại API mỗi lần.
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
export interface BaseLaunchOptions extends Omit<SpawnOptions, 'executablePath'> {
  executablePath?: string;
  launcher?: { launch: (opts: BaseLaunchOptions) => Promise<Browser> };
  key?: string;
  defaultViewport?: { width: number; height: number } | null;
  [key: string]: unknown;
}

// ─── Configuration Methods ────────────────────────────────────────────────────

/**
 * Plugin core fingerprint -- quản lý cấu hình, spawn worker, gọi API.
 * Sử dụng Fluent API: useFingerprint().useProxy().useProfile()... rồi spawn().
 *
 * Fluent API giúp cấu hình từng thành phần một cách rõ ràng, tránh constructor đồ sộ
 * và cho phép gọi lại nhiều lần với các giá trị khác nhau trên cùng instance.
 */
export default class FingerprintPlugin {
  protected launcher: { launch: (opts: BaseLaunchOptions) => Promise<Browser> };
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

  /**
   * @param launcherInstance - Launcher tuỳ chỉnh, nếu không có thì dùng mặc định
   * @param connector - Connector tuỳ chỉnh, nếu không có thì tạo mới (dùng cho test)
   */
  constructor(
    launcherInstance?: { launch: (opts: BaseLaunchOptions) => Promise<Browser> },
    connector?: Connector,
  ) {
    this.#connector = connector ?? new Connector();
    this.launcher =
      launcherInstance ?? ({ launch } as unknown as { launch: (opts: BaseLaunchOptions) => Promise<Browser> });
  }
  /**
   * Factory method -- validate launcher trước khi khởi tạo.
   *
   * Việc validate sớm ngăn lỗi runtime do launcher không đúng contract,
   * đặc biệt hữu ích khi plugin được embed trong các framework như Playwright.
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
   * Browser fingerprint cần được inject trước khi bất kỳ script nào chạy,
   * nếu không các trang web có thể phát hiện sự khác biệt giữa fingerprint
   * giả và môi trường thực tế (canvas, WebGL, audio...).
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
   * Lưu profile riêng biệt giúp duy trì phiên đăng nhập và trạng thái
   * giữa các lần chạy, tránh bị phát hiện là session mới hoàn toàn.
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
   * Proxy làm thay đổi IP và vị trí địa lý của request, phối hợp với fingerprint
   * để tránh bị phát hiện automation. Cần set proxy trước khi browser khởi tạo
   * kết nối mạng đầu tiên.
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
   * Mỗi phiên bản trình duyệt có các đặc trưng fingerprint riêng (User-Agent,
   * WebGL vendor, font...). Chọn đúng version giúp fingerprint khớp với
   * environment mong muốn.
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
   * Proxy từ CLI thường do người dùng set thủ công, cần ưu tiên hơn proxy mặc định
   * để đảm bảo đúng ý đồ cấu hình mà không làm ghi đè useProxy().
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
   * Worker cần quyền ghi để tạo file tạm và socket, do đó cần một thư mục
   * riêng biệt tránh xung đột với các tiến trình khác cùng chạy.
   *
   * @param folder - Đường dẫn tuyệt đối
   */
  setWorkingFolder(folder: string): void {
    this.#connector.setCwd(path.resolve(folder));
  }

  /**
   * Timeout cho mỗi request API (mặc định: 0 = không timeout).
   *
   * API fingerprint service có thể bị treo do network flaky, timeout giúp
   * giải phóng tài nguyên thay vì chờ vô hạn.
   *
   * @param timeout - Thời gian timeout (ms)
   */
  setRequestTimeout(timeout: number): void {
    this.#connector.setRequestTimeout(timeout || 0);
  }

  /**
   * Timeout khởi động engine -- nếu quá lâu coi như lỗi.
   *
   * Worker spawn có thể bị kẹt do antivirus hoặc permission, timeout sớm
   * cho phép fallback hoặc retry thay vì treo toàn bộ ứng dụng.
   *
   * @param timeout - Thời gian timeout (ms)
   */
  setEngineTimeout(timeout: number): void {
    this.#connector.setEngineTimeout(timeout || 0);
  }

  /**
   * Gán private key -- dùng cho API fetch/versions và setup engine.
   *
   * Key xác thực người dùng với dịch vụ fingerprint, tránh lạm dụng API.
   * Phải set trước bất kỳ lệnh gọi API nào.
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
   * Gọi API riêng thay vì lấy trong lúc spawn giúp tách biệt việc lấy dữ liệu
   * và khởi động browser, cho phép cache hoặc xử lý fingerprint offline.
   *
   * @param options - Bộ lọc (tags, time, quantity...)
   * @returns JSON string fingerprint
   */
  async fetch(options: FetchOptions = {}): Promise<string> {
    return (await this.#connector.api('fetch', {
      key: this.#serviceKey,
      options,
      version: this.version,
    })) as string;
  }

  /**
   * Danh sách browser version có sẵn -- default trả về string[], extended trả về Version[].
   *
   * Version list phụ thuộc vào engine đang chạy và key; cần biết trước các version
   * hợp lệ để tránh lỗi khi gọi useBrowserVersion với version không tồn tại.
   *
   * @param format - 'default' | 'extended'
   * @returns Danh sách version
   */
  async versions<T extends 'default' | 'extended' = 'default'>(
    format: T = 'default' as T
  ): Promise<T extends 'extended' ? Version[] : string[]> {
    return (await this.#connector.api('versions', { format })) as unknown as T extends 'extended'
      ? Version[]
      : string[];
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────

  /**
   * Khởi động browser -- spawn worker.exe với cấu hình đã đăng ký.
   *
   * Spawn tách biệt với cấu hình (configure) vì worker cần start trước,
   * sau đó mới inject fingerprint qua CDP, đảm bảo không có request nào
   * diễn ra trước khi fingerprint sẵn sàng.
   *
   * @param options - LaunchOptions (args, headless, proxy...)
   * @returns Browser instance
   */
  async spawn(options: BaseLaunchOptions = {}): Promise<Browser> {
    return this._launch(true, options);
  }

  protected async configure(
    cleanup: () => void | Promise<void>,
    browser: Browser,
    bounds?: { width?: number; height?: number },
    sync?: <T>(fn: () => Promise<T> | T) => Promise<T>
  ): Promise<void> {
    // Hook method — subclasses override for custom behaviour.
    // Base forwards to ConfigManager for backward compat.
    if (typeof this.#configManager.configure === 'function')
      return this.#configManager.configure(cleanup, browser, bounds, sync);
  }

  protected async _launch(useDefaultLauncher: boolean, options: BaseLaunchOptions = {}): Promise<Browser> {
    // --- Bước 1: Trích xuất proxy từ arguments nếu chưa set qua useProxy()
    // CLI proxy có độ ưu tiên thấp hơn proxy đã set trước đó, tránh ghi đè cấu hình chủ ý.
    this.setProxyFromArguments(options.args || []);

    // --- Bước 2: Gọi API setup -- engine khởi tạo profile, fingerprint, proxy
    // Setup phải được gọi trước khi spawn worker để engine chuẩn bị sẵn
    // các file cấu hình và thư mục tạm cần thiết.
    const setupData = (await this.#connector.api('setup', {
      proxy: this.proxy,
      fingerprint: this.fingerprint,
      version: this.version,
      profile: this.profile ?? {
        value: getProfilePath(options),
        options: { loadProxy: true, loadFingerprint: true },
      },
      pid: crypto.randomUUID(),
      key: typeof options.key === 'string' ? options.key : this.#serviceKey,
    })) as SetupResponse;
    const { id, pid, pwd, path: browserPath, bounds, ...config } = setupData;
    this.processId = pid;

    // --- Bước 3: Đăng ký cleaner + tạo mutex -- dọn dẹp khi process kết thúc
    // Mutex ngăn hai tiến trình dùng chung một profile đồng thời gây corrupt dữ liệu.
    // Cleaner đảm bảo worker tạm được xoá sau khi browser đóng.
    await this.#cleaner.watch(pwd).ignore(pwd, pid, id);
    mutex.create(`BASProcess${pid}`);

    // --- Bước 4: Chọn launcher -- mặc định (spawn) hoặc custom (plugin bridge)
    // Launcher mặc định dùng child_process.spawn, custom dùng để tích hợp với Playwright.
    const activeLauncher = useDefaultLauncher
      ? ({ launch } as unknown as { launch: (opts: BaseLaunchOptions) => Promise<Browser> })
      : (options.launcher ?? this.launcher);

    // --- Bước 5: Spawn worker.exe -- headless: false vì fingerprint check phát hiện headless
    // Hầu hết các fingerprint service (như Pixelscan) đánh dấu headless Chrome là bot,
    // do đó bắt buộc phải chạy non-headless để tránh bị phát hiện.
    const launchOpts: BaseLaunchOptions = {
      ...options,
      headless: false,
      userDataDir: undefined,
      defaultViewport: undefined,
      executablePath: `${browserPath}/worker.exe`,
      args: [`--parent-process-id=${pid}`, `--unique-process-id=${id}`, ...defaultArgs({ ...options, ...config })],
    };
    const browser = await activeLauncher.launch(launchOpts);
    this.browser = browser;

    // --- Bước 6: Cấu hình và đồng bộ -- inject fingerprint, proxy vào browser
    // Configure thực hiện inject qua CDP, synchronize đảm bảo fingerprint được áp dụng
    // trước khi bất kỳ trang web nào tải.
    type ConfigFn = (
      cleanup: () => void | Promise<void>,
      browser: Browser,
      bounds?: { width?: number; height?: number },
      sync?: (fn: () => Promise<void>) => Promise<void>
    ) => Promise<void>;
    const configFn: ConfigFn = useDefaultLauncher
      ? (this.#configManager.configure.bind(this.#configManager) as unknown as ConfigFn)
      : (this.configure.bind(this) as ConfigFn);
    await configFn(
      () => this.#cleaner.include(pwd, pid, id),
      browser,
      bounds,
      this.#configManager.synchronize.bind(this.#configManager, id, pwd, bounds)
    );
    return browser;
  }

  /**
   * Dọn dẹp tài nguyên -- kill browser process, engine, cleaner, mutex.
   *
   * Thứ tự: browser trước (worker.exe), connector (engine) sau, cleaner cuối cùng.
   * PCAP server không bị đóng vì là singleton dùng chung cho cả process.
   *
   * Việc dọn dẹp theo thứ tự này tránh lỗi "process already exited" và đảm bảo
   * các file tạm không bị xoá khi browser vẫn đang ghi dữ liệu.
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
 *
 * Singleton giúp toàn bộ ứng dụng dùng chung một engine, tránh khởi tạo nhiều
 * worker gây tốn tài nguyên và xung đột port.
 */
export const plugin = new FingerprintPlugin();
