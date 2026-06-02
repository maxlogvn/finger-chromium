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
import { BROWSER_RUNNING_DIR } from './chromium';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdaDataManagerOptions {
  tempRootDir?: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Quản lý ánh xạ profile -- sao chép từ thư mục gốc sang thư mục tạm
 * để tránh ghi trực tiếp vào profile gốc trong lúc browser đang chạy.
 * Dùng map() để copy, unmap() để xoá thư mục tạm.
 */
export class AdapterDataManager {
  private readonly tempRootDir: string;
  private readonly instanceTempDir: string;

  constructor(options: AdaDataManagerOptions = {}) {
    this.tempRootDir = options.tempRootDir ?? path.join(BROWSER_RUNNING_DIR, 'profile');
    this.instanceTempDir = path.join(this.tempRootDir, this.generateUniqueName());
  }

  map(sourceProfileDir: string): string;

  map(tempProfileDir: string, destinationDir: string): string;

  /**
   * Sao chép profile -- từ source sang temp (bỏ targetDir) hoặc từ temp sang destination.
   * Nếu không có targetDir, tạo temp dir mới.
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
      throw new Error(
        `[DataManager] Sao chép thất bại: "${srcResolved}" → "${destResolved}".\n${(error as Error).message}`
      );
    }
    return destResolved;
  }

  /**
   * Xoá thư mục tạm -- gọi khi kết thúc session.
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
      throw new Error(`[DataManager] Dọn dẹp thất bại: "${resolvedPath}".\n${(error as Error).message}`);
    }
  }

  /**
   * Dọn dẹp toàn bộ -- xoá instance temp dir.
   */
  dispose(): void {
    this.unmap(this.instanceTempDir);
  }

  private ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  /**
   * Tạo tên duy nhất cho temp dir -- timestamp + random hex.
   * Dùng Math.random thay vì crypto để tránh blocking.
   */
  private generateUniqueName(): string {
    const hex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0');
    return `${Date.now()}_${hex}`;
  }
}
