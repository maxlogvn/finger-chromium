import fs from 'node:fs';
import path from 'node:path';
import { BROWSER_RUNNING_DIR } from './chromium';

export interface AdaDataManagerOptions {
  tempRootDir?: string;
}
export class AdapterDataManager {
  private readonly tempRootDir: string;
  private readonly instanceTempDir: string;
  constructor(options: AdaDataManagerOptions = {}) {
    this.tempRootDir = options.tempRootDir ?? path.join(BROWSER_RUNNING_DIR, "profile");
    this.instanceTempDir = path.join(this.tempRootDir, this.generateUniqueName());
  }

  map(sourceProfileDir: string): string;

  map(tempProfileDir: string, destinationDir: string): string;

  map(inputDir: string, targetDir?: string): string {
    const dest = targetDir ?? this.instanceTempDir;
    console.log(dest)
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

  dispose(): void {
    this.unmap(this.instanceTempDir);
  }

  private ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  private generateUniqueName(): string {
    const hex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0');
    return `${Date.now()}_${hex}`;
  }
}
