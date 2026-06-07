// ─── File: cleaner.ts ─────────────────────────────────────────────────────
// Dọn dẹp settings file cũ của BAS – lock/unlock và cleanup theo interval.
//
//   1. ignore/include – lock/unlock file settings của process
//   2. watch – theo dõi thư mục và cleanup định kỳ
//   3. stop – dừng cleanup, unlock toàn bộ
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import path from 'node:path';
import { rm } from 'fs/promises';

import fg from 'fast-glob';
import lock from 'proper-lockfile';
import createDebug from 'debug';

const debug = createDebug('browser-with-fingerprints:cleaner');
const CLEANUP_INTERVAL = 15_000;
const getLockablePaths = (pid: string, id: string): string[] => [`t/${pid}`, `s/${id}.ini`, `s/${id}1.ini`];

// ─── SettingsCleaner ─────────────────────────────────────────────────────────

export class SettingsCleaner {
  #timer: ReturnType<typeof setInterval> | null = null;
  #folders: string[] = [];

  async ignore(folder: string, pid: string, id: string): Promise<void> {
    await this.#toggleLock(true, folder, pid, id);
  }

  async include(folder: string, pid: string, id: string): Promise<void> {
    await this.#toggleLock(false, folder, pid, id);
  }

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

  async stop(): Promise<void> {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    for (const folder of this.#folders) {
      const pattern = path.join(folder, '{t,s}', '*');
      const entries = await fg(pattern, {
        stats: true,
        onlyFiles: false
      });
      for (const {
        path: entryPath
      } of entries) {
        const isLocked = await lock.check(entryPath).catch(() => false);
        if (isLocked) {
          await lock.unlock(entryPath).catch(() => {});
        }
      }
    }
    this.#folders = [];
  }

  async #toggleLock(shouldLock: boolean, folder: string, pid: string, id: string): Promise<void> {
    const lockablePaths = getLockablePaths(pid, id);
    for (const relativePath of lockablePaths) {
      const fullPath = path.join(folder, relativePath);
      try {
        await lock[shouldLock ? 'lock' : 'unlock'](fullPath, {
          onCompromised: () => {
            debug(`File lock tại đường dẫn ${fullPath} không được cập nhật.`);
          }
        });
      } catch (err) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr.code !== 'ENOENT') throw err;
      }
    }
  }

  async #cleanup(): Promise<void> {
    for (const folder of this.#folders) {
      const pattern = path.join(folder, `{t,s}`, '*');
      const entries = await fg(pattern, {
        stats: true,
        onlyFiles: false
      });
      for (const {
        path: entryPath,
        stats
      } of entries) {
        if (!stats || Date.now() - stats.mtimeMs <= CLEANUP_INTERVAL) continue;
        const parsedPath = path.parse(entryPath);
        const checkPath = parsedPath.ext === '.txt' && path.basename(parsedPath.dir) === 's' ? path.format({
          ...parsedPath,
          base: undefined,
          ext: '.ini'
        }) : entryPath;
        const isLocked = await lock.check(checkPath).catch(() => false);
        if (isLocked) continue;
        await rm(entryPath, {
          recursive: true,
          force: true
        });
      }
    }
  }
}

export default new SettingsCleaner();