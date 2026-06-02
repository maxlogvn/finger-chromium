// ─── File: connector/index.ts ─────────────────────────────────────────────
// API Connector -- giao tiếp với RemoteEngine qua file-based IPC.
// Singleton engine instance với async-lock đồng bộ.
//
//   1. Khởi tạo RemoteEngine với cwd và timeout từ env
//   2. Khởi động PCAP server
//   3. api() -- wrapper error normalization, lock đồng bộ
// ─────────────────────────────────────────────────────────────────────────────

import RemoteEngine from './engine';
import * as pcapServer from './pcapServer';
import AsyncLock from 'async-lock';
import { MissingKeyError, PluginError } from '../errors';
import debugFactory from 'debug';

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
  options?: {
    perfectCanvasRequest?: boolean;
  };
  [key: string]: unknown;
}

interface EngineResult {
  error?: string;
  response?: unknown;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const lock = new AsyncLock();

const engine = new RemoteEngine({
  cwd: process.env.FINGERPRINT_CWD,
  engineTimeout: process.env.FINGERPRINT_TIMEOUT,
  requestTimeout: process.env.FINGERPRINT_TIMEOUT,
} as EngineOptions);

engine.on('beforeExtract', () => {
  console.log('Đang cài đặt browser -- quá trình này có thể mất một chút thời gian.');
});

engine.on('beforeDownload', () => {
  console.log('Đang tải browser -- quá trình này có thể mất một chút thời gian.');
});

pcapServer.listen().then((port: number) => {
  debug(`PCAP server đang lắng nghe tại port ${port}`);
  engine.setArgs([`--mock-pcap-port=${port}`]);
});

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Gọi API engine -- wrapper error normalization với async-lock.
 * Lock 'client' đảm bảo chỉ một request được xử lý tại một thời điểm.
 */
export const api = async (name: string, params: ApiParams = {}): Promise<unknown> => {
  let notifyTimer: ReturnType<typeof setTimeout> | undefined;
  return lock.acquire('client', async () => {
    try {
      const { error, ...result } = (await engine.runFunction(name, params, {
        requestTimeout: params?.options?.perfectCanvasRequest ? 0 : engine.requestTimeout,
      } as RunFunctionOptions)) as EngineResult;
      if (error) {
        throw error.includes('key is missing') ? new MissingKeyError(error) : new PluginError(error);
      }
      return result.response ?? result;
    } finally {
      clearTimeout(notifyTimer);
    }
  });
};

export { engine };
