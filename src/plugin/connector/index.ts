// ─── File: connector/index.ts ─────────────────────────────────────────────
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

// ─── PCAP Server Singleton ────────────────────────────────────────────────────

/**
 * Module-level init promise cho PCAP server (một TCP server cho cả process).
 * Mỗi Connector lấy port từ promise này và set args riêng cho engine của mình.
 */
let initPromise: Promise<number> | undefined;

// ─── Connector ────────────────────────────────────────────────────────────────

/**
 * Mỗi instance sở hữu RemoteEngine riêng, AsyncLock riêng.
 * PCAP server dùng chung ở module-level (singleton).
 */
export default class Connector {
  #engine: RemoteEngine;
  #lock = new AsyncLock();

  constructor(options?: EngineOptions) {
    this.#engine = new RemoteEngine({
      cwd: process.env.FINGERPRINT_CWD,
      engineTimeout: process.env.FINGERPRINT_TIMEOUT,
      requestTimeout: process.env.FINGERPRINT_TIMEOUT,
      ...options,
    } as EngineOptions);

    this.#engine.on('beforeExtract', () => {
      console.log('Dang cai dat browser -- qua trinh nay co the mat mot chut thoi gian.');
    });

    this.#engine.on('beforeDownload', () => {
      console.log('Dang tai browser -- qua trinh nay co the mat mot chut thoi gian.');
    });
  }

  /**
   * Dam bao PCAP server duoc khoi dong truoc lan goi API dau tien.
   * Tra ve port de set args cho engine.
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

  get requestTimeout(): number {
    return this.#engine.requestTimeout;
  }

  setCwd(value: string): void {
    this.#engine.setCwd(value);
  }

  setRequestTimeout(value: number): void {
    this.#engine.setRequestTimeout(value);
  }

  setEngineTimeout(value: number): void {
    this.#engine.setEngineTimeout(value);
  }

  /**
   * Goi API engine -- wrapper error normalization voi async-lock.
   * Lock 'client' dam bao chi mot request duoc xu ly tai mot thoi diem.
   */
  async api(name: string, params: ApiParams = {}): Promise<unknown> {
    const port = await this.#ensurePcapPort();
    this.#engine.setArgs([`--mock-pcap-port=${port}`]);

    let notifyTimer: { clear: () => void } | undefined;
    return this.#lock.acquire('client', async () => {
      try {
        const { error, ...result } = (await this.#engine.runFunction(name, params, {
          requestTimeout: (params?.options as { perfectCanvasRequest?: boolean } | undefined)?.perfectCanvasRequest ? 0 : this.requestTimeout,
        } as RunFunctionOptions)) as EngineResult;
        if (error) {
          if (error.includes('key is missing')) {
            notifyTimer = notify(params.key);
            throw new MissingKeyError(error);
          }
          throw new PluginError(error);
        }
        return result.response ?? result;
      } finally {
        notifyTimer?.clear();
      }
    });
  }

  /**
   * Don dep connector -- kill engine process va cho no thoat han.
   * Khong dong PCAP server vi cac instance khac co the dang dung.
   */
  async cleanup(): Promise<void> {
    await this.#engine.kill();
  }
}
