// ─── File: plugin/utils.ts ─────────────────────────────────────────────────
// Tiện ích cho plugin -- xử lý arguments, profile path, validation.
//
//   1. defaultArgs() -- lọc và xây dựng arguments cho Chromium
//   2. getProfilePath() -- trích xuất đường dẫn profile từ options
//   3. validateConfig() -- kiểm tra tham số cấu hình hợp lệ
//   4. validateLauncher() -- kiểm tra launcher object có method launch
// ─────────────────────────────────────────────────────────────────────────────

import path from 'node:path';
import { PluginError } from './errors.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Các argument mặc định cho Chromium.
 * --disable-features: tắt các tính năng gây nhiễu fingerprint (NetworkServiceInProcess2, ...)
 * --disk-cache-size: giới hạn cache để tránh để lại dấu vết trên disk.
 */
const DEFAULT_ARGS: readonly string[] = [
  '--lang=en',
  '--no-proxy-server',
  '--disable-auto-reload',
  '--bas-disable-tab-hook',
  '--disk-cache-size=5000000',
  '--disable-features=NetworkServiceInProcess2,OptimizationGuideModelDownloading,AutoDeElevate',
];

/**
 * Các argument bị cấm -- nếu user truyền vào sẽ bị lọc bỏ.
 * Những argument này làm thay đổi hành vi trình duyệt gây lộ fingerprint
 * (kiosk, headless, user-data-dir do ta tự quản lý, ...).
 */
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

export interface GetProfilePathOptions {
  args?: string[];
  userDataDir?: string;
}

interface BrowserLauncher {
  launch: (...args: unknown[]) => Promise<unknown> | unknown;
  [key: string]: unknown;
}

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Xây dựng arguments Chromium từ input của user.
 *
 * **Tại sao lọc IGNORED_ARGS?** Một số argument (vd --kiosk, --headless) có thể
 * làm thay đổi fingerprint hoặc gây conflict với cơ chế tự quản lý user-data-dir.
 * **Tại sao force --bas-force-visible-window khi không headless?** Một số trang
 * kiểm tra headless mode bằng window.outerWidth/outerHeight. Flag này ép
 * window có kích thước thật, tránh bị phát hiện.
 *
 * @param options - Tuỳ chọn arguments
 * @returns Mảng arguments hoàn chỉnh để spawn Chromium
 */
export const defaultArgs = ({
  args = [],
  profile = '',
  devtools = false,
  headless = !devtools,
  extensions = [],
}: DefaultArgsOptions = {}): string[] => {
  // --- Bước 1: Tạo argument user-data-dir (do ta quản lý)
  const result: string[] = [`--user-data-dir=${profile}`];

  // --- Bước 2: Lọc và xử lý từng argument user truyền vào
  const processed = args.reduce(
    (acc: string[], arg: string): string[] => {
      const [key, value] = arg.split('=');
      // Bỏ qua các argument bị cấm
      if (!IGNORED_ARGS.some((ignored) => arg.includes(ignored))) {
        // Gộp extension nếu có nhiều --load-extension hoặc --disable-extensions-except
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

  // --- Bước 3: Thêm flag headless hoặc force visible window
  if (headless) {
    result.push('--hide-scrollbars', '--mute-audio');
  } else {
    // --bas-force-visible-window: ép window có kích thước thật, tránh headless detection
    result.push('--bas-force-visible-window');
  }

  // --- Bước 4: Gộp với default args
  return processed.concat(result, DEFAULT_ARGS);
};

/**
 * Trích xuất đường dẫn profile từ options.
 *
 * **Tại sao ưu tiên userDataDir?** Vì đây là cách hiện đại và rõ ràng nhất để
 * chỉ định profile. Fallback sang --user-data-dir trong args để tương thích
 * với cách gọi cũ (khi profile được truyền qua args).
 *
 * @param options - Tuỳ chọn chứa args hoặc userDataDir
 * @returns Đường dẫn profile tuyệt đối, hoặc chuỗi rỗng nếu không có
 */
export const getProfilePath = ({ args = [], userDataDir = '' }: GetProfilePathOptions = {}): string => {
  if (userDataDir) {
    return path.resolve(userDataDir);
  }
  const profilePathArg = args.find((arg: string) => arg.startsWith('--user-data-dir'));
  return profilePathArg ? profilePathArg.split('=')[1] : '';
};

/**
 * Validate tham số cấu hình (fingerprint, proxy, profile).
 *
 * **Tại sao?** Đảm bảo các tham số bắt buộc có kiểu đúng, tránh lỗi runtime
 * khó hiểu khi truyền vào object null hoặc kiểu sai.
 *
 * @param type - Tên cấu hình (dùng trong message lỗi)
 * @param value - Giá trị cấu hình (phải là string)
 * @param options - Object cấu hình (phải là object không null)
 * @throws PluginError nếu không hợp lệ
 */
export const validateConfig = (type: string, value: unknown, options: unknown): void => {
  if (typeof value !== 'string' || typeof options !== 'object' || options === null) {
    throw new PluginError(`Tham số không hợp lệ cho cấu hình "${type}".`);
  }
};

/**
 * Validate launcher object.
 *
 * **Tại sao?** Yêu cầu launcher phải có method `launch` là function, bởi vì
 * engine cần gọi `launcher.launch()` để spawn trình duyệt. Kiểm tra sớm
 * giúp báo lỗi rõ ràng thay vì crash ở sâu bên trong.
 *
 * @param launcher - Đối tượng launcher cần kiểm tra
 * @throws PluginError nếu launcher không hợp lệ
 */
export const validateLauncher = (launcher: unknown): void => {
  if (launcher == null || typeof launcher !== 'object' || typeof (launcher as BrowserLauncher).launch !== 'function') {
    throw new PluginError('Browser launcher không được hỗ trợ - yêu cầu một object có method "launch".');
  }
};
