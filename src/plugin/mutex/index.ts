// ─── File: mutex/index.ts ──────────────────────────────────────────────────
// Windows named mutex -- native C++ addon (mutex.node) cho win32 32/64-bit.
//
//   1. Load mutex.node từ plugin/mutex/{platform}-{arch}/
//   2. create() -- tạo named mutex cho BASProcess
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { PluginError } from '../errors';

const requireNative = createRequire(import.meta.url);

// ─── Package Root ─────────────────────────────────────────────────────────────

function resolvePackageRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    try {
      const pkg = requireNative(path.join(current, 'package.json'));
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {
      // chưa tìm thấy -- tiếp tục đi lên
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new PluginError('[Mutex] Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.');
    }
    current = parent;
  }
}

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_PATH = resolvePackageRoot(path.dirname(__filename));

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
      throw new PluginError(`Unsupported OS architecture for named mutex.${detail}`);
    }

    console.error(`[Mutex] Nền tảng không được hỗ trợ: ${process.platform}${detail}`);
    throw new PluginError(`Unsupported OS platform for named mutex.${detail}`);
  }
})();

export default mutex;
export const create = mutex.create;

/**
 * Release named mutex -- gọi native close() nếu được hỗ trợ.
 * Nếu native chưa có method close(), skip silently.
 * Windows kernel tự cleanup handle mutex khi process thoát.
 */
export const release = (name: string): void => {
  if (typeof mutex.close === 'function') {
    mutex.close(name);
  }
};
