// ─── File: adapter/playwright/chromium.ts ──────────────────────────────────
// Namespace điều khiển trình duyệt Chromium với hỗ trợ fingerprint, proxy và profile.
//
//   1. Tạo instance mới: `new BrowserEngine()` — mỗi instance độc lập
//   2. Đăng ký cấu hình (fingerprint, proxy, profile) qua Fluent API
//   3. Khởi động engine -- launch()
//   4. Tạo Playwright BrowserContext -- newContext()
//   5. Dọn dẹp tài nguyên và lưu profile -- quit()
// ─────────────────────────────────────────────────────────────────────────────

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
/** Options cho launchPersistentContext -- trích xuất từ kiểu Playwright. */
export type PluginLaunchOptions = Parameters<BrowserType['launchPersistentContext']>[1];
/** Launcher có thể tuỳ chỉnh -- cho phép dùng Playwright patch hoặc mặc định. */
export type Launcher = Pick<BrowserType, 'launch' | 'launchPersistentContext'>;

// ─── Constants ────────────────────────────────────────────────────────────────

/** Key bảo mật từ biến môi trường BABLOSOFT_KEY -- dùng cho API engine. */
export const PRIVATE_KEY = process.env.BABLOSOFT_KEY ?? '';
/** Thư mục tạm cho browser đang chạy -- lưu profile runtime, bị xoá khi quit. */
export const BROWSER_RUNNING_DIR = path.join(process.cwd(), process.env.BROWSER_RUNNING_DIR ?? '.tmp/browser/running');
/** Thư mục làm việc của engine -- nơi giải nén và chạy worker.exe. */
export const ENGINE_WORKING_DIR = path.join(process.cwd(), process.env.ENGINE_WORKING_DIR ?? '.tmp/browser/engine');

/**
 * Options mặc định cho context -- headless: false vì fingerprint check phát hiện headless,
 * hasTouch: true để giả lập thiết bị cảm ứng.
 */
export const DEFAULT_CONTEXT_OPTIONS: PluginLaunchOptions = {
  headless: false,
  hasTouch: true,
};

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Engine điều khiển Chromium -- tích hợp fingerprint, proxy, profile.
 * Dùng `new BrowserEngine()` để tạo instance riêng cho mỗi session.
 */
export class BrowserEngine implements PWChromium {
  public engine: PlaywrightFingerprintPlugin;

  private options: PluginLaunchOptions;
  private privateKey: string;
  private readonly engineWorkingDirPath: string;
  private readonly dataManager: AdapterDataManager;
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

  /**
   * Thay thế Playwright launcher mặc định bằng bản patch -- dùng khi cần custom.
   *
   * @param launcher - Launcher tuỳ chỉnh (phải hỗ trợ launch + launchPersistentContext)
   */
  repackChromium(launcher: Launcher): this {
    this.engine = new PlaywrightFingerprintPlugin(launcher);
    return this;
  }

  /**
   * Gắn fingerprint cho browser -- data và tuỳ chọn làm nhiễu WebGL, Audio, Canvas...
   *
   * @param data - Fingerprint data (JSON string)
   * @param options - PerfectCanvas, WebGL noise, Audio noise...
   */
  useFingerprint(data: string, options?: FingerprintOptions): this {
    this.fingerprints = [data, options];
    return this;
  }

  /**
   * Định tuyến traffic qua proxy -- HTTP/HTTPS/SOCKS4/SOCKS5.
   *
   * @param data - URL proxy (vd: http://user:pass@host:port)
   * @param options - timezone, geolocation, WebRTC, DNS...
   */
  useProxy(data: string, options?: ProxyOptions): this {
    this.proxyData = [data, options];
    return this;
  }

  /**
   * Liên kết profile -- thư mục chứa cookie, localStorage.
   * Profile được map sang thư mục tạm tránh corrupt dữ liệu gốc.
   *
   * @param dirPath - Đường dẫn thư mục profile
   * @param options - loadProxy, loadFingerprint từ profile cũ
   */
  useProfile(dirPath: string, options?: ProfileOptions): this {
    this.saveProfileDirPath = dirPath;
    this.profileData = [this.dataManager.map(dirPath), options];
    return this;
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────

  /**
   * Khởi động engine -- hợp nhất options, đăng ký key, cấu hình engine.
   * Chỉ được gọi một lần, throw error nếu gọi lại.
   */
  launch(options: Partial<PluginLaunchOptions> = {}): this {
    if (this.isLaunched) {
      throw new Error('[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan.');
    }

    // --- Bước 1: Hợp nhất options -- mặc định < cấu hình trước < truyền vào lúc launch
    this.options = { ...this.options, ...options };

    // --- Bước 2: Cấu hình engine với key, thư mục làm việc và profile
    this.engine.setServiceKey(this.privateKey);
    this.engine.setWorkingFolder(this.engineWorkingDirPath);
    this.engine.useProfile(...this.profileData);

    // --- Bước 3: Đăng ký proxy và fingerprint nếu đã được cấu hình
    if (this.proxyData) this.engine.useProxy(...this.proxyData);
    if (this.fingerprints) this.engine.useFingerprint(...this.fingerprints);

    this.isLaunched = true;
    return this;
  }

  /**
   * Tạo Playwright BrowserContext với fingerprint/proxy/profile đã cấu hình.
   * Phải gọi launch() trước. Chỉ tạo được một context -- gọi quit() trước nếu muốn tạo mới.
   *
   * @param options - Context options (viewport, geolocation...)
   * @returns BrowserContext đã inject fingerprint
   */
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

  /**
   * Lấy fingerprint mới từ service -- gọi lại API fetch.
   *
   * @param options - Bộ lọc fingerprint (tags, time...)
   * @returns JSON string fingerprint
   */
  async newFingerprint(options: FetchOptions | undefined) {
    return await this.engine.fetch(options);
  }

  /**
   * Dọn dẹp tài nguyên -- đóng context, lưu profile, unmap thư mục tạm.
   * An toàn khi gọi nhiều lần (kiểm tra isLaunched).
   *
   * @param saveDataPath - Đường dẫn lưu profile (ghi đè lên đường dẫn gốc nếu có)
   */
  async quit(saveDataPath?: string): Promise<void> {
    if (!this.isLaunched) return;
    this.isLaunched = false;

    if (this.context) {
      // --- Bước 1: Đóng context -- giải phóng port, process
      await this.context.close();
      this.context = undefined;

      // --- Bước 2: Lưu profile -- map từ thư mục tạm về thư mục đích
      const targetSavePath = saveDataPath ?? this.saveProfileDirPath;
      if (targetSavePath) {
        this.dataManager.map(this.profileData[0], targetSavePath);
      }
    }

    // --- Bước 3: Dọn dẹp engine -- kill worker.exe, engine process, PCAP server, cleaner, mutex
    await this.engine.cleanup();

    // --- Bước 4: Unmap thư mục tạm
    this.dataManager.unmap(BROWSER_RUNNING_DIR);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Alias backward compatibility cho code cũ import `Chromium`.
 * Giờ là class, không phải instance — dùng `new BrowserEngine()` hoặc `new Chromium()`.
 *
 * @example
 * const engine = new BrowserEngine();
 * const context = await engine
 *   .useFingerprint(fp)
 *   .launch()
 *   .newContext();
 */
export const Chromium = BrowserEngine;
