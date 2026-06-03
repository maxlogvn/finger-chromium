// ─── File: plugin/utils.ts ─────────────────────────────────────────────────
// Tiện ích cho plugin -- xử lý arguments, profile path, validation.
//
//   1. defaultArgs() -- lọc và xây dựng arguments cho Chromium
//   2. getProfilePath() -- trích xuất đường dẫn profile từ options
//   3. validateConfig() -- kiểm tra tham số cấu hình hợp lệ
//   4. validateLauncher() -- kiểm tra launcher object có method launch
// ─────────────────────────────────────────────────────────────────────────────

import path from 'path';
import { PluginError } from './errors';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ARGS: readonly string[] = [
  '--lang=en',
  '--no-proxy-server',
  '--disable-auto-reload',
  '--bas-disable-tab-hook',
  '--disk-cache-size=5000000',
  '--disable-features=NetworkServiceInProcess2,OptimizationGuideModelDownloading,AutoDeElevate',
];

const IGNORED_ARGS: readonly string[] = [
  '--kiosk',
  '--headless',
  '--user-data-dir',
  '--start-maximized',
  '--start-fullscreen',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DefaultArgsOptions {
  args?: string[];
  profile?: string;
  devtools?: boolean;
  headless?: boolean;
  extensions?: string[];
}

interface GetProfilePathOptions {
  args?: string[];
  userDataDir?: string;
}

interface ValidateConfigOptions {
  [key: string]: unknown;
}

interface BrowserLauncher {
  launch: (...args: unknown[]) => Promise<unknown> | unknown;
  [key: string]: unknown;
}

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Xây dựng arguments Chromium -- lọc IGNORED_ARGS, xử lý extensions,
 * force --bas-force-visible-window khi không headless (tránh bị phát hiện).
 */
export const defaultArgs = ({
  args = [],
  profile = '',
  devtools = false,
  headless = !devtools,
  extensions = [],
}: DefaultArgsOptions = {}): string[] => {
  const result: string[] = [`--user-data-dir=${profile}`];
  const processed = args.reduce(
    (acc: string[], arg: string): string[] => {
      const [key, value] = arg.split('=');
      if (!IGNORED_ARGS.some((ignored) => arg.includes(ignored))) {
        if (key.includes('disable-extensions-except') || key.includes('load-extension')) {
          acc.push(
            `${key}=${extensions
              .concat(value || '')
              .filter(Boolean)
              .join(',')}`
          );
        } else {
          acc.push(arg);
        }
      }
      return acc;
    },
    extensions.length ? [`--load-extension=${extensions.join(',')}`] : []
  );
  if (headless) {
    result.push('--hide-scrollbars', '--mute-audio');
  } else {
    result.push('--bas-force-visible-window');
  }
  return processed.concat(result, DEFAULT_ARGS);
};

/**
 * Trích xuất đường dẫn profile từ options -- ưu tiên userDataDir,
 * fallback sang --user-data-dir trong args.
 */
export const getProfilePath = ({ args = [], userDataDir = '' }: GetProfilePathOptions = {}): string => {
  if (userDataDir) {
    return path.resolve(userDataDir);
  }
  const profilePathArg = args.find((arg: string) => arg.startsWith('--user-data-dir'));
  return profilePathArg ? profilePathArg.split('=')[1] : '';
};

/**
 * Validate tham số cấu hình (fingerprint, proxy, profile) -- value phải là string,
 * options phải là object không null.
 */
export const validateConfig = (type: string, value: unknown, options: unknown): void => {
  if (typeof value !== 'string' || typeof options !== 'object' || options === null) {
    throw new PluginError(`Tham số không hợp lệ cho cấu hình "${type}".`);
  }
};

/**
 * Validate launcher -- phải là object có method launch là function.
 */
export const validateLauncher = (launcher: unknown): void => {
  if (launcher == null || typeof launcher !== 'object' || typeof (launcher as BrowserLauncher).launch !== 'function') {
    throw new PluginError('Browser launcher không được hỗ trợ - yêu cầu một object có method "launch".');
  }
};
