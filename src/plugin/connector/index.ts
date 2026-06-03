// ─── File: connector/index.ts ─────────────────────────────────────────────
// API Connector -- giao tiếp với RemoteEngine qua file-based IPC.
// Singleton engine instance với async-lock đồng bộ.
//
//   1. Khởi tạo RemoteEngine với cwd và timeout từ env
//   2. api() -- lazy init PCAP server ở lần gọi đầu, wrapper error normalization, lock đồng bộ
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

// ─── Lazy Init ─────────────────────────────────────────────────────────────────

/**
 * Đảm bảo PCAP server được khởi động trước lần gọi API đầu tiên.
 * Dùng module-level promise để chỉ init một lần (safe pattern thay vì side-effect ở module scope).
 */
let initPromise: Promise<void> | undefined;

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = pcapServer.listen().then((port: number) => {
      debug(`PCAP server đang lắng nghe tại port ${port}`);
      engine.setArgs([`--mock-pcap-port=${port}`]);
    });
  }
  return initPromise;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Gọi API engine -- wrapper error normalization với async-lock.
 * Lock 'client' đảm bảo chỉ một request được xử lý tại một thời điểm.
 */
export const api = async (name: string, params: ApiParams = {}): Promise<unknown> => {
  await ensureInit();
  let notifyTimer: Parameters<typeof clearTimeout>[0] | undefined;
  return lock.acquire('client', async () => {
    try {
      const { error, ...result } = (await engine.runFunction(name, params, {
        requestTimeout: params?.options?.perfectCanvasRequest ? 0 : engine.requestTimeout,
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
      clearTimeout(notifyTimer);
    }
  });
};

/**
 * Dọn dẹp connector -- kill engine process và close PCAP server.
 * Gọi khi kết thúc session để giải phóng tài nguyên nền.
 */
export const cleanup = async (): Promise<void> => {
  engine.kill();
  await pcapServer.close();
};

export { engine };
