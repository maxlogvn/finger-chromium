// ─── File: mutex/index.ts ──────────────────────────────────────────────────
// Windows named mutex -- native C++ addon (mutex.node) cho win32 32/64-bit.
//
//   1. Load mutex.node từ plugin/mutex/{platform}-{arch}/
//   2. create() -- tạo named mutex cho BASProcess
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const requireNative = createRequire(import.meta.url);

// ─── Package Root ─────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_PATH = path.resolve(__dirname, '../../../');

// ─── Types ────────────────────────────────────────────────────────────────────

interface MutexModule {
  create: (name: string) => void;
  [key: string]: unknown;
}

// ─── Native Module ────────────────────────────────────────────────────────────

const mutex: MutexModule = (() => {
  try {
    const modulePath = path.join(PACKAGE_PATH, `plugin/mutex/${process.platform}-${process.arch}/mutex.node`);
    return requireNative(modulePath) as MutexModule;
  } catch (error: unknown) {
    const nodeErr = error as NodeJS.ErrnoException;
    const detail = nodeErr.message ? ` Chi tiết: ${nodeErr.message}` : '';

    if (process.platform === 'win32') {
      console.error(`[Mutex] Kiến trúc không được hỗ trợ: ${process.arch}${detail}`);
      throw new Error(`Unsupported OS architecture for named mutex.${detail}`);
    }

    console.error(`[Mutex] Nền tảng không được hỗ trợ: ${process.platform}${detail}`);
    throw new Error(`Unsupported OS platform for named mutex.${detail}`);
  }
})();

export default mutex;
export const create = mutex.create;
