// ─── File: adapter/playwright/data.ts ──────────────────────────────────────
// Quản lý profile data -- map profile từ thư mục gốc sang thư mục tạm,
// tránh corrupt dữ liệu khi browser đang chạy.
//
//   1. Tạo instance temp dir khi khởi tạo
//   2. map() -- sao chép profile vào temp dir
//   3. unmap() -- xoá temp dir khi quit
//   4. dispose() -- dọn dẹp toàn bộ
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { PluginError } from '../../plugin/errors';
import { BROWSER_RUNNING_DIR } from './fluent';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Tuỳ chọn khởi tạo AdapterDataManager.
 * Cho phép chỉ định thư mục gốc chứa các profile tạm (temp root),
 * giúp cô lập dữ liệu giữa nhiều instance và tránh xung đột thư mục.
 */
export interface AdaDataManagerOptions {
  tempRootDir?: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Quản lý ánh xạ profile: sao chép từ thư mục gốc sang thư mục tạm
 * để **tránh ghi trực tiếp vào profile gốc khi browser đang chạy**,
 * nguyên nhân chính gây corrupt dữ liệu (file bị khoá, crash giữa chừng).
 *
 * Sau khi browser đóng, dùng `map(tempDir, originalDir)` để sao chép
 * ngược lại, lưu các thay đổi (cookie, localStorage,...) vào profile gốc.
 */
export class AdapterDataManager {
  private readonly tempRootDir: string;
  private readonly instanceTempDir: string;

  constructor(options: AdaDataManagerOptions = {}) {
    this.tempRootDir = options.tempRootDir ?? path.join(BROWSER_RUNNING_DIR, 'profile');
    this.instanceTempDir = path.join(this.tempRootDir, this.generateUniqueName());
  }

  /**
   * Sao chép profile gốc vào thư mục tạm (khi khởi tạo session).
   */
  map(sourceProfileDir: string): string;

  /**
   * Sao chép profile từ thư mục tạm ngược về thư mục đích (khi quit).
   */
  map(tempProfileDir: string, destinationDir: string): string;

  /**
   * Sao chép profile theo hai chiều:
   * - Nếu chỉ có `inputDir` (source): tạo bản sao vào `instanceTempDir` để browser làm việc,
   *   bảo vệ dữ liệu gốc khỏi corrupt.
   * - Nếu có `targetDir`: sao chép từ `inputDir` (thư mục tạm) sang `targetDir` (profile gốc)
   *   để lưu lại toàn bộ thay đổi sau khi browser đóng.
   *
   * @param inputDir - Thư mục nguồn
   * @param targetDir - (Optional) Thư mục đích; nếu bỏ trống sẽ copy vào temp của instance
   * @returns Đường dẫn thư mục đích đã được resolve
   */
  map(inputDir: string, targetDir?: string): string {
    const dest = targetDir ?? this.instanceTempDir;
    const srcResolved = path.resolve(inputDir);
    const destResolved = path.resolve(dest);
    this.ensureDir(srcResolved);
    this.ensureDir(path.dirname(destResolved));
    try {
      fs.cpSync(srcResolved, destResolved, { recursive: true, force: true });
    } catch (error) {
      throw new PluginError(
        `[DataManager] Sao chép thất bại: "${srcResolved}" → "${destResolved}".\n${(error as Error).message}`
      );
    }
    return destResolved;
  }

  /**
   * Xoá thư mục tạm để giải phóng dung lượng đĩa và tránh rò rỉ dữ liệu
   * khi kết thúc session.
   *
   * @param tempDirPath - Đường dẫn thư mục tạm cần xoá
   */
  unmap(tempDirPath: string): void {
    const resolvedPath = path.resolve(tempDirPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`[DataManager] Bỏ qua xoá: thư mục không tồn tại "${resolvedPath}"`);
      return;
    }
    try {
      fs.rmSync(resolvedPath, { recursive: true, force: true });
    } catch (error) {
      throw new PluginError(`[DataManager] Dọn dẹp thất bại: "${resolvedPath}".\n${(error as Error).message}`);
    }
  }

  /**
   * Dọn dẹp toàn bộ tài nguyên của instance hiện tại.
   * Được gọi khi `quit()` để xoá thư mục tạm của chính instance,
   * đảm bảo không để lại dữ liệu thừa trên đĩa.
   */
  dispose(): void {
    this.unmap(this.instanceTempDir);
  }

  private ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  /**
   * Tạo tên duy nhất cho thư mục tạm: timestamp + random hex.
   * Dùng `Math.random` thay vì `crypto` để tránh blocking khi khởi tạo,
   * độ unique đủ dùng cho tiến trình đơn lẻ.
   */
  private generateUniqueName(): string {
    const hex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0');
    return `${Date.now()}_${hex}`;
  }
}
