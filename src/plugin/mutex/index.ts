// ─── File: index.ts ──────────────────────────────────────────────────────
// Native mutex module – tạo/release named mutex cho BAS process.
//
//   1. Load native .node module theo platform+arch
//   2. Export create / release helpers
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import path from 'node:path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import { PluginError } from '../errors';
import { resolvePackageRoot } from '../utils';

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_PATH = resolvePackageRoot(path.dirname(__filename));
const requireNative = createRequire(import.meta.url);

// ─── Types ───────────────────────────────────────────────────────────────────

interface MutexModule {
  create: (name: string) => void;
  close?: (name: string) => void;
  [key: string]: unknown;
}

// ─── Mutex ───────────────────────────────────────────────────────────────────

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

// ─── Export ──────────────────────────────────────────────────────────────────

export default mutex;
export const create = mutex.create;
export const release = (name: string): void => {
  if (typeof mutex.close === 'function') {
    mutex.close(name);
  }
};