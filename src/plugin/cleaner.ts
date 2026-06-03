// ─── File: plugin/cleaner.ts ───────────────────────────────────────────────
// Dọn dẹp file tạm của engine -- xoá các file không còn process sở hữu.
// Dùng proper-lockfile để tránh xoá file đang dùng.
//
//   1. watch() -- đăng ký thư mục cần dọn dẹp, khởi động timer 15s
//   2. ignore() -- lock file (không xoá) khi process đang chạy
//   3. include() -- unlock file (cho phép xoá) khi process kết thúc
//   4. cleanup interval -- quét và xoá file hết hạn
// ─────────────────────────────────────────────────────────────────────────────

import fg from 'fast-glob';
import path from 'node:path';
import { rm } from 'fs/promises';
import lock from 'proper-lockfile';
import createDebug from 'debug';

const debug = createDebug('browser-with-fingerprints:cleaner');

// ─── Constants ────────────────────────────────────────────────────────────────

const CLEANUP_INTERVAL = 15_000;
const LOCKABLE_ITEMS = (pid: string, id: string): string[] => [`t/${pid}`, `s/${id}.ini`, `s/${id}1.ini`];

// ─── SettingsCleaner ──────────────────────────────────────────────────────────

/**
 * Quản lý lock/unlock file tạm của engine để tránh xoá nhầm khi còn dùng.
 * Khởi động timer 15s quét và dọn dẹp các file không còn process sở hữu.
 */
export class SettingsCleaner {
  #timer: ReturnType<typeof setInterval> | null = null;
  #folders: string[] = [];

  /**
   * Lock file -- ngăn cleaner xoá file khi process đang chạy.
   */
  async ignore(folder: string, pid: string, id: string): Promise<void> {
    await this.#toggleLock(true, folder, pid, id);
  }

  /**
   * Unlock file -- cho phép cleaner xoá khi process kết thúc.
   */
  async include(folder: string, pid: string, id: string): Promise<void> {
    await this.#toggleLock(false, folder, pid, id);
  }

  /**
   * Đăng ký thư mục cần dọn dẹp và khởi động timer nếu chưa có.
   */
  watch(folder: string): this {
    if (!this.#folders.includes(folder)) {
      this.#folders.push(folder);
    }
    if (!this.#timer) {
      void this.#cleanup();
      this.#timer = setInterval(() => void this.#cleanup(), CLEANUP_INTERVAL).unref();
    }
    return this;
  }

  async #toggleLock(shouldLock: boolean, folder: string, pid: string, id: string): Promise<void> {
    for (const item of LOCKABLE_ITEMS(pid, id)) {
      const itemPath = path.join(folder, item);
      try {
        await lock[shouldLock ? 'lock' : 'unlock'](itemPath, {
          onCompromised: () => {
            debug(`File lock tại đường dẫn ${itemPath} không được cập nhật.`);
          },
        });
      } catch (err) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr.code !== 'ENOENT') throw err;
      }
    }
  }

  /**
   * Dừng cleaner -- clear interval, unlock files còn locked, clear folders.
   */
  async stop(): Promise<void> {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    for (const folder of this.#folders) {
      const pattern = path.join(folder, '{t,s}', '*');
      const entries = await fg(pattern, { stats: true, onlyFiles: false });
      for (const { path: entryPath } of entries) {
        const isLocked = await lock.check(entryPath).catch(() => false);
        if (isLocked) {
          await lock.unlock(entryPath).catch(() => {});
        }
      }
    }
    this.#folders = [];
  }

  async #cleanup(): Promise<void> {
    for (const folder of this.#folders) {
      const pattern = path.join(folder, `{${['t', 's'].join(',')}}`, '*');
      const entries = await fg(pattern, { stats: true, onlyFiles: false });
      for (const { path: entryPath, stats } of entries) {
        if (!stats || Date.now() - stats.mtimeMs <= CLEANUP_INTERVAL) continue;
        const parsedPath = path.parse(entryPath);
        const checkPath =
          parsedPath.ext === '.txt' && path.basename(parsedPath.dir) === 's'
            ? path.format({ ...parsedPath, base: undefined, ext: '.ini' })
            : entryPath;
        const isLocked = await lock.check(checkPath).catch(() => false);
        if (isLocked) continue;
        await rm(entryPath, { recursive: true, force: true });
      }
    }
  }
}

/**
 * @deprecated Từ v1.x. Không còn được production code sử dụng.
 * Dùng `new SettingsCleaner()` để tạo instance riêng.
 * Sẽ bị xoá ở major version 2.0.
 */
export default new SettingsCleaner();
