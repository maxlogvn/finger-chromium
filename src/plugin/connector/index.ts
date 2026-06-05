// ─── File: index.ts ─────────────────────────────────────────────────────
// API Connector -- giao tiếp với RemoteEngine qua file-based IPC.
// Mỗi Connector instance sở hữu RemoteEngine riêng, không dùng chung.
//
//   1. Constructor tạo RemoteEngine mới + đăng ký event listeners
//   2. api() -- lazy init PCAP server ở lần gọi đầu, wrapper error normalization, lock đồng bộ
//   3. cleanup() -- chỉ kill engine của instance đó, không đóng PCAP server (dùng chung)
// ─────────────────────────────────────────────────────────────────────────────

import RemoteEngine from './engine';
import * as pcapServer from './pcapServer';
import AsyncLock from 'async-lock';
import { MissingKeyError, PluginError } from '../errors';
import debugFactory from 'debug';
import { notify } from './utils';

const debug = debugFactory('browser-with-fingerprints:connector');

// ─── Types ────────────────────────────────────────────────────────────────────

interface EngineOptions {
  cwd?: string;
  engineTimeout?: string | number;
  requestTimeout?: string | number;
}

interface RunFunctionOptions {
  requestTimeout?: number;
}

interface ApiParams {
  key?: string;
  options?: unknown;
  [key: string]: unknown;
}

interface EngineResult {
  error?: string;
  response?: unknown;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Module-level init promise cho PCAP server (một TCP server cho cả process).
 * Mỗi Connector lấy port từ promise này và set args riêng cho engine của mình.
 */
let initPromise: Promise<number> | undefined;

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Mỗi instance sở hữu RemoteEngine riêng, AsyncLock riêng.
 * PCAP server dùng chung ở module-level (singleton) để tránh xung đột cổng TCP.
 */
export default class Connector {
  #engine: RemoteEngine;
  #lock = new AsyncLock();

  /**
   * Khởi tạo Connector với RemoteEngine mới và đăng ký các event listener thông báo.
   * Các listener này chỉ hiển thị console log, không ảnh hưởng luồng chính.
   *
   * @param options - Cấu hình cho RemoteEngine (cwd, timeout)
   */
  constructor(options?: EngineOptions) {
    this.#engine = new RemoteEngine({
      cwd: process.env.FINGERPRINT_CWD,
      engineTimeout: process.env.FINGERPRINT_TIMEOUT,
      requestTimeout: process.env.FINGERPRINT_TIMEOUT,
      ...options,
    } as EngineOptions);

    // --- Bước 1: Lắng nghe sự kiện trước khi extract fingerprint
    this.#engine.on('beforeExtract', () => {
      console.log('Dang cai dat browser -- qua trinh nay co the mat mot chut thoi gian.');
    });

    // --- Bước 2: Lắng nghe sự kiện trước khi download browser
    this.#engine.on('beforeDownload', () => {
      console.log('Dang tai browser -- qua trinh nay co the mat mot chut thoi gian.');
    });
  }

  /**
   * Đảm bảo PCAP server được khởi động trước lần gọi API đầu tiên.
   * Trả về port để set args cho engine.
   * Dùng module-level promise để các Connector dùng chung một server.
   *
   * @returns Port mà PCAP server đang lắng nghe
   */
  async #ensurePcapPort(): Promise<number> {
    if (!initPromise) {
      initPromise = pcapServer.listen().then((port: number) => {
        debug(`PCAP server dang lang nghe tai port ${port}`);
        return port;
      });
    }
    return initPromise;
  }

  /** Thời gian chờ tối đa cho mỗi request (ms) */
  get requestTimeout(): number {
    return this.#engine.requestTimeout;
  }

  /**
   * Ghi đè thư mục làm việc của engine.
   * Hữu ích khi cần chạy engine từ vị trí khác mà không tạo Connector mới.
   *
   * @param value - Đường dẫn thư mục mới
   */
  setCwd(value: string): void {
    this.#engine.setCwd(value);
  }

  /**
   * Ghi đè timeout request.
   *
   * @param value - Thời gian chờ mới (ms)
   */
  setRequestTimeout(value: number): void {
    this.#engine.setRequestTimeout(value);
  }

  /**
   * Ghi đè timeout toàn bộ engine process.
   *
   * @param value - Thời gian chờ mới (ms)
   */
  setEngineTimeout(value: number): void {
    this.#engine.setEngineTimeout(value);
  }

  /**
   * Gọi API engine (ví dụ: 'createFingerprint', 'getBrowser').
   * Tự động đảm bảo PCAP server đã sẵn sàng, đồng bộ hóa request và chuẩn hóa lỗi.
   * Dùng lock để đảm bảo chỉ một request được xử lý tại một thời điểm trên mỗi instance,
   * tránh xung đột khi engine chưa hỗ trợ concurrent.
   *
   * @param name - Tên API cần gọi
   * @param params - Tham số truyền vào API (bao gồm key, options, ...)
   * @returns Kết quả trả về từ engine (response hoặc toàn bộ result object)
   * @throws {MissingKeyError} Khi engine báo thiếu key
   * @throws {PluginError} Khi engine trả về lỗi khác
   */
  async api(name: string, params: ApiParams = {}): Promise<unknown> {
    // --- Bước 1: Khởi động PCAP server nếu chưa chạy
    const port = await this.#ensurePcapPort();
    this.#engine.setArgs([`--mock-pcap-port=${port}`]);

    let notifyTimer: { clear: () => void } | undefined;
    // --- Bước 2: Đồng bộ lock để tránh concurrent gọi engine
    return this.#lock.acquire('client', async () => {
      try {
        const { error, ...result } = (await this.#engine.runFunction(name, params, {
          requestTimeout: (params?.options as { perfectCanvasRequest?: boolean } | undefined)?.perfectCanvasRequest
            ? 0
            : this.requestTimeout,
        } as RunFunctionOptions)) as EngineResult;
        if (error) {
          // --- Bước 3: Xử lý lỗi đặc thù: thiếu key
          if (error.includes('key is missing')) {
            notifyTimer = notify(params.key);
            throw new MissingKeyError(error);
          }
          throw new PluginError(error);
        }
        return result.response ?? result;
      } finally {
        // --- Bước 4: Dọn dẹp timer thông báo (nếu có) sau khi throw hoặc thành công
        notifyTimer?.clear();
      }
    });
  }

  /**
   * Dọn dẹp Connector: kill process engine riêng của instance này.
   * Không đóng PCAP server vì các Connector khác có thể đang dùng.
   *
   * @returns Promise hoàn thành khi engine đã dừng hẳn
   */
  async cleanup(): Promise<void> {
    await this.#engine.kill();
  }
}
