// ─── File: data.ts ───────────────────────────────────────────────────────
// AdapterDataManager – quản lý sao chép và dọn dẹp profile data.
//
//   1. map – copy profile từ source sang temp
//   2. unmap – xoá temp profile
//   3. dispose – dọn dẹp instance temp dir
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

import { PluginError } from '../../plugin/errors';
import { BROWSER_RUNNING_DIR } from './fluent';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdaDataManagerOptions {
  tempRootDir?: string;
}

// ─── AdapterDataManager ──────────────────────────────────────────────────────

export class AdapterDataManager {
  private readonly tempRootDir: string;
  private readonly instanceTempDir: string;

  constructor(options: AdaDataManagerOptions = {}) {
    this.tempRootDir = options.tempRootDir ?? path.join(BROWSER_RUNNING_DIR, 'profile');
    this.instanceTempDir = path.join(this.tempRootDir, this.generateUniqueName());
  }

  map(inputDir: string, targetDir?: string): string {
    const dest = targetDir ?? this.instanceTempDir;
    const srcResolved = path.resolve(inputDir);
    const destResolved = path.resolve(dest);
    this.ensureDir(srcResolved);
    this.ensureDir(path.dirname(destResolved));
    try {
      fs.cpSync(srcResolved, destResolved, {
        recursive: true,
        force: true
      });
    } catch (error) {
      throw new PluginError(`[DataManager] Sao chép thất bại: "${srcResolved}" → "${destResolved}".\n${(error as Error).message}`);
    }
    return destResolved;
  }

  unmap(tempDirPath: string): void {
    const resolvedPath = path.resolve(tempDirPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`[DataManager] Bỏ qua xoá: thư mục không tồn tại "${resolvedPath}"`);
      return;
    }
    try {
      fs.rmSync(resolvedPath, {
        recursive: true,
        force: true
      });
    } catch (error) {
      throw new PluginError(`[DataManager] Dọn dẹp thất bại: "${resolvedPath}".\n${(error as Error).message}`);
    }
  }

  dispose(): void {
    this.unmap(this.instanceTempDir);
  }

  private ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, {
      recursive: true
    });
  }

  private generateUniqueName(): string {
    const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    return `${String(Date.now())}_${hex}`;
  }
}