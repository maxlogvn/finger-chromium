// ─── File: utils.ts ──────────────────────────────────────────────────────
// Utility functions cho plugin: default args, profile path, validation, package root.
//
//   1. defaultArgs – sinh danh sách argument mặc định cho Chromium
//   2. getProfilePath – trích xuất đường dẫn profile từ options
//   3. validateConfig – kiểm tra cấu hình fingerprint/profile/proxy
//   4. validateLauncher – kiểm tra browser launcher
//   5. resolvePackageRoot – tìm thư mục gốc của package
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import path from 'node:path';
import { createRequire } from 'module';
import { PluginError } from './errors';

// ─── Constants ───────────────────────────────────────────────────────────────

const requireNative = createRequire(import.meta.url);
const DEFAULT_ARGS: readonly string[] = ['--lang=en', '--no-proxy-server', '--disable-auto-reload', '--bas-disable-tab-hook', '--disk-cache-size=5000000', '--disable-features=NetworkServiceInProcess2,OptimizationGuideModelDownloading,AutoDeElevate'];
const IGNORED_ARGS: readonly string[] = ['--kiosk', '--headless', '--user-data-dir', '--start-maximized', '--start-fullscreen'];

// ─── Types ───────────────────────────────────────────────────────────────────

interface DefaultArgsOptions {
  args?: string[];
  profile?: string;
  devtools?: boolean;
  headless?: boolean;
  extensions?: string[];
}

export interface GetProfilePathOptions {
  args?: string[];
  userDataDir?: string;
}

interface BrowserLauncher {
  launch: (...args: unknown[]) => unknown;
}

// ─── Default Args ────────────────────────────────────────────────────────────

export const defaultArgs = ({
  args = [],
  profile = '',
  devtools = false,
  headless = !devtools,
  extensions = []
}: DefaultArgsOptions = {}): string[] => {
  const result: string[] = [`--user-data-dir=${profile}`];
  const processed = args.reduce((acc: string[], arg: string): string[] => {
    const [key, value] = arg.split('=');
    if (!IGNORED_ARGS.some(ignored => arg.includes(ignored))) {
      if (key.includes('disable-extensions-except') || key.includes('load-extension')) {
        acc.push(`${key}=${extensions.concat(value || '').filter(Boolean).join(',')}`);
      } else {
        acc.push(arg);
      }
    }
    return acc;
  }, extensions.length ? [`--load-extension=${extensions.join(',')}`] : []);
  if (headless) {
    result.push('--hide-scrollbars', '--mute-audio');
  } else {
    result.push('--bas-force-visible-window');
  }
  return processed.concat(result, DEFAULT_ARGS);
};

// ─── Profile Path ────────────────────────────────────────────────────────────

export const getProfilePath = ({
  args = [],
  userDataDir = ''
}: GetProfilePathOptions = {}): string => {
  if (userDataDir) {
    return path.resolve(userDataDir);
  }
  const profilePathArg = args.find((arg: string) => arg.startsWith('--user-data-dir'));
  return profilePathArg ? profilePathArg.split('=')[1] : '';
};

// ─── Validation ──────────────────────────────────────────────────────────────

export const validateConfig = (type: string, value: unknown, options: unknown): void => {
  if (typeof value !== 'string' || typeof options !== 'object' || options === null) {
    throw new PluginError(`Tham số không hợp lệ cho cấu hình "${type}".`);
  }
};

export const validateLauncher = (launcher: unknown): void => {
  if (launcher == null || typeof launcher !== 'object' || typeof (launcher as BrowserLauncher).launch !== 'function') {
    throw new PluginError('Browser launcher không được hỗ trợ - yêu cầu một object có method "launch".');
  }
};

// ─── Package Root ────────────────────────────────────────────────────────────

export function resolvePackageRoot(startDir: string): string {
  let current = startDir;
  for (;;) {
    try {
      const pkg = requireNative(path.join(current, 'package.json')) as { name: string };
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {}
    const parent = path.dirname(current);
    if (parent === current) {
      throw new PluginError('[Mutex] Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.');
    }
    current = parent;
  }
}