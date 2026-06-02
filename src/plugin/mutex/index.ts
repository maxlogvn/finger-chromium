import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const requireNative = createRequire(import.meta.url);

// Tự resolve đường dẫn gốc của package, tránh circular dependency với index.ts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Điều chỉnh số lần ".." tùy theo vị trí thực tế của file này trong project
const PACKAGE_PATH = path.resolve(__dirname, '../../../');


interface MutexModule {
  create: (name: string) => void;
  [key: string]: unknown;
}

const mutex: MutexModule = (() => {
  try {
    const modulePath = path.join(PACKAGE_PATH, `plugin/mutex/${process.platform}-${process.arch}/mutex.node`);
    console.log(modulePath);
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
