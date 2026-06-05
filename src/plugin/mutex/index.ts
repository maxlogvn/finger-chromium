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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tìm đường dẫn gốc của package `fingerprint-chromium-engine`.
 * Lý do: native addon được đặt trong `plugin/mutex/`, cần biết chính xác thư mục
 * gốc để load đúng file nhị phân, ngay cả khi ứng dụng chạy từ thư mục không phải
 * node_modules (ví dụ: bundled app).
 *
 * @param startDir - Đường dẫn bắt đầu tìm kiếm (thường là `__dirname` của file hiện tại)
 * @returns Đường dẫn tuyệt đối đến thư mục gốc package
 * @throws {PluginError} Nếu không tìm thấy package.json của đúng package
 */
function resolvePackageRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    try {
      const pkg = requireNative(path.join(current, 'package.json'));
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {
      // package.json không tồn tại hoặc không đúng tên -- tiếp tục đi lên
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

/** Interface mô tả các method của native module mutex. */
interface MutexModule {
  create: (name: string) => void;
  close?: (name: string) => void;
  [key: string]: unknown;
}

// ─── Native Module ────────────────────────────────────────────────────────────

/**
 * Native module mutex, được load từ `plugin/mutex/${platform}-${arch}/mutex.node`.
 * Nếu platform/arch không được hỗ trợ (ví dụ Linux hoặc macOS), throw `PluginError`.
 */
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

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Native module mutex. Trong hầu hết trường hợp, dùng trực tiếp các hàm `create`
 * và `release` được export riêng sẽ thuận tiện hơn.
 */
export default mutex;

/**
 * Tạo named mutex trên Windows.
 *
 * @param name - Tên mutex (thường dùng để đồng bộ giữa các process)
 */
export const create = mutex.create;

/**
 * Giải phóng named mutex.
 * Gọi native `close()` nếu được hỗ trợ. Nếu native chưa implement `close`, bỏ qua.
 *
 * Lý do: Windows kernel tự động cleanup handle mutex khi process thoát, nên không
 * cần giải phóng tường minh. Tuy nhiên, một số trường hợp (ví dụ test) muốn giải
 * phóng sớm, method này cho phép làm điều đó nếu addon hỗ trợ.
 *
 * @param name - Tên mutex đã tạo trước đó
 */
export const release = (name: string): void => {
  if (typeof mutex.close === 'function') {
    mutex.close(name);
  }
};
