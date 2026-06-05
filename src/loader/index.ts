// ─── File: loader/index.ts ──────────────────────────────────────────────────
// Module loader -- resolve package, kiểm tra version, trả về module theo property.
// Việc tách riêng logic import và version check giúp tái sử dụng khi có fallback packages.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'module';
import { compare } from 'compare-versions';
import { PluginError } from '../plugin/errors';

// Dùng createRequire vì file này là ESM, nhưng cần require để load package động
// và đọc package.json mà không cần fs.readFileSync.
const require = createRequire(import.meta.url);

// ─── Loader Class ────────────────────────────────────────────────────────────

/**
 * Loader module -- thử lần lượt packages, validate version >= minimum.
 * Dùng cho Playwright và các dependencies có thể đổi tên package giữa các major version.
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
   * Thử import lần lượt packages, trả về [module, version] đầu tiên tìm thấy.
   *
   * Design: dùng static method để có thể gọi riêng lẻ trong quá trình debug
   * hoặc fallback mà không cần khởi tạo instance.
   *
   * @param packages - Danh sách package names (ưu tiên theo thứ tự)
   * @returns [module, version] hoặc undefined nếu packages rỗng
   * @throws {PluginError} Khi không tìm thấy package nào -- tránh crash do missing dep
   * @default []
   */
  static import(packages: string[] = []): [unknown, string] | undefined {
    if (!packages.length) return undefined;
    for (const id of packages) {
      try {
        // require thay vì import() vì có thể package chưa được ESM-ready
        const mod = require(id);
        // Lấy version trực tiếp từ package.json thay vì dùng require('package/version')
        // vì version field là nguồi tin cậy duy nhất.
        const pkgVersion: string = require(`${id}/package.json`).version;
        return [mod, pkgVersion];
      } catch {
        // Lặp qua package tiếp theo -- cho phép người dùng cài đặt bất kỳ package nào
        // trong danh sách fallback, hữu ích khi tên package thay đổi giữa các bản phát hành.
        continue;
      }
    }
    throw new PluginError(`None of the following packages could be found - "${packages.join('", "')}".`);
  }

  /**
   * Load module -- resolve package, validate version, trả về property (vd: 'chromium').
   *
   * Lý do trả về property thay vì toàn bộ module: Playwright export chromium dưới dạng
   * property `chromium`, nhưng một số package (ví dụ puppeteer) export trực tiếp class.
   * Cơ chế này hoạt động với cả hai dạng.
   *
   * @param property - Tên property cần lấy từ module (mặc định 'chromium' vì đó là nhu cầu phổ biến)
   * @returns Module (hoặc property của module) đã load
   * @throws {PluginError} Khi không resolve được package hoặc version không đạt yêu cầu
   */
  load<T = unknown>(property = 'chromium'): T {
    // Thử import target trước, sau đó mới đến fallback packages.
    // Thứ tự này ưu tiên package chính xác (đã được kiểm thử kỹ) nếu có.
    const result = Loader.import([this.target, ...this.packages]);
    if (!result) {
      throw new PluginError(`Failed to resolve package "${this.target}".`);
    }
    const [module, version] = result;

    // Kiểm tra version vì các API của Playwright thay đổi không tương thích qua major versions.
    // Nếu không check, code có thể dùng API của version cũ (ví dụ 'launch' vs 'launchPersistent').
    if (version && this.version && compare(version, this.version, '<')) {
      throw new PluginError(
        `Version ${version} of the "${this.target}" package is not supported - use version ${this.version} or higher.`
      );
    }

    const mod = module as Record<string, unknown>;
    // Nếu module có property yêu cầu, trả về property đó (ví dụ: playwright.chromium).
    // Ngược lại trả về cả module (puppeteer export thẳng). Cả hai đều có API tương tự.
    return property in mod ? (mod[property] as T) : (module as T);
  }
}
