// ─── File: loader/index.ts ──────────────────────────────────────────────────
// Module loader -- resolve package, kiểm tra version, trả về module theo property.
//
//   1. Tạo Loader instance với target, minimum version, fallback packages
//   2. import() -- thử từng package, trả về module đầu tiên tìm thấy
//   3. load() -- gọi import(), validate version, trả về property (vd: 'chromium')
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'module';
import { compare } from 'compare-versions';
import { PluginError } from '../plugin/errors';

const require = createRequire(import.meta.url);

/**
 * Loader module -- thử lần lượt packages, validate version >= minimum.
 * Dùng cho Playwright và các dependencies có version requirement.
 */
export default class Loader {
  private readonly target: string;
  private readonly version: string;
  private readonly packages: string[];

  constructor(target: string, version: string, packages: string[] = []) {
    this.target = target;
    this.version = version;
    this.packages = packages;
  }

  /**
   * Thử import lần lượt packages, trả về [module, version] đầu tiên.
   *
   * @param packages - Danh sách package names
   * @returns [module, version] hoặc undefined nếu packages rỗng
   */
  static import(packages: string[] = []): [unknown, string] | undefined {
    if (!packages.length) return undefined;
    for (const id of packages) {
      try {
        const mod = require(id);
        const pkgVersion: string = require(`${id}/package.json`).version;
        return [mod, pkgVersion];
      } catch {
        continue;
      }
    }
    throw new PluginError(`None of the following packages could be found - "${packages.join('", "')}".`);
  }

  /**
   * Load module -- resolve package, validate version, trả về property (vd: 'chromium').
   *
   * @param property - Tên property cần lấy từ module (mặc định 'chromium')
   * @returns Module đã load
   */
  load<T = unknown>(property = 'chromium'): T {
    const result = Loader.import([this.target, ...this.packages]);
    if (!result) {
      throw new PluginError(`Failed to resolve package "${this.target}".`);
    }
    const [module, version] = result;
    if (version && this.version && compare(version, this.version, '<')) {
      throw new PluginError(
        `Version ${version} of the "${this.target}" package is not supported - use version ${this.version} or higher.`
      );
    }
    const mod = module as Record<string, unknown>;
    return property in mod ? (mod[property] as T) : module as T;
  }
}
