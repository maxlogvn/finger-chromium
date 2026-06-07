// ─── File: index.ts ──────────────────────────────────────────────────────
// Connector – cầu nối giữa plugin và RemoteEngine, quản lý PCAP server và API calls.
//
//   1. Khởi tạo RemoteEngine với env config
//   2. ensurePcapPort – đảm bảo PCAP server đang chạy
//   3. api – gọi function trên engine với async-lock
//   4. cleanup – dừng engine
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import AsyncLock from 'async-lock';
import debugFactory from 'debug';

import RemoteEngine from './engine';
import * as pcapServer from './pcapServer';
import { MissingKeyError, PluginError } from '../errors';
import { notify } from './utils';

const debug = debugFactory('browser-with-fingerprints:connector');

// ─── Types ───────────────────────────────────────────────────────────────────

interface EngineOptions {
  cwd?: string;
  engineTimeout?: string | number;
  requestTimeout?: string | number;
}
interface ApiParams {
  key?: string;
  options?: unknown;
  [key: string]: unknown;
}
// ─── Connector ───────────────────────────────────────────────────────────────

let initPromise: Promise<number> | undefined;

export default class Connector {
  #engine: RemoteEngine;
  #lock = new AsyncLock();

  constructor(options?: EngineOptions) {
    this.#engine = new RemoteEngine({
      cwd: process.env.FINGERPRINT_CWD,
      engineTimeout: process.env.FINGERPRINT_TIMEOUT,
      requestTimeout: process.env.FINGERPRINT_TIMEOUT,
      ...options,
    });
    this.#engine.on('beforeExtract', () => {
      console.log('Dang cai dat browser -- qua trinh nay co the mat mot chut thoi gian.');
    });
    this.#engine.on('beforeDownload', () => {
      process.stdout.write('Dang tai browser: 0%');
    });
    this.#engine.on('downloadProgress', (p: { bytes: number; total?: number; percent?: number }) => {
      const mb = (p.bytes / 1024 / 1024).toFixed(1);
      const totalMb = p.total ? '/' + (p.total / 1024 / 1024).toFixed(1) + 'MB' : 'MB';
      const pct = p.percent != null ? String(p.percent) + '%' : mb + totalMb;
      process.stdout.write('\rDang tai browser: ' + pct);
    });
  }

  async #ensurePcapPort(): Promise<number> {
    if (!initPromise) {
      initPromise = pcapServer.listen().then((port: number) => {
        debug(`PCAP server dang lang nghe tai port ${String(port)}`);
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

  async api(name: string, params: ApiParams = {}): Promise<unknown> {
    const port = await this.#ensurePcapPort();
    this.#engine.setArgs([`--mock-pcap-port=${String(port)}`]);
    let notifyTimer:
      | {
          clear: () => void;
        }
      | undefined;
    return this.#lock.acquire('client', async () => {
      try {
        const { error, ...result } = await this.#engine.runFunction(name, params, {
          requestTimeout: (
            params.options as
              | {
                  perfectCanvasRequest?: boolean;
                }
              | undefined
          )?.perfectCanvasRequest
            ? 0
            : this.requestTimeout,
        });
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

  async cleanup(): Promise<void> {
    await this.#engine.kill();
  }
}
