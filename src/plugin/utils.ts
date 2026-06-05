// ─── File: plugin/utils.ts ─────────────────────────────────────────────────
// Tiện ích cho plugin -- xử lý arguments, profile path, validation.
//
//   Các hàm này tách biệt logic phức tạp ra khỏi core class, giúp dễ kiểm thử
//   và tái sử dụng khi cần mở rộng (ví dụ: thêm loại cấu hình mới).
//   1. defaultArgs() -- lọc và xây dựng arguments cho Fluent
//   2. getProfilePath() -- trích xuất đường dẫn profile từ options
//   3. validateConfig() -- kiểm tra tham số cấu hình hợp lệ
//   4. validateLauncher() -- kiểm tra launcher object có method launch
// ─────────────────────────────────────────────────────────────────────────────

import path from 'node:path';
import { PluginError } from './errors.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Các argument mặc định cho Fluent.
 *
 * `--disable-features=NetworkServiceInProcess2,OptimizationGuideModelDownloading,AutoDeElevate`
 *   - NetworkServiceInProcess2: bật chế độ network service in-process gây thay đổi
 *     fingerprint network stack, tắt để giữ fingerprint ổn định.
 *   - OptimizationGuideModelDownloading: tự động tải model ML, làm lộ hành vi bot.
 *   - AutoDeElevate: liên quan đến UAC, không cần thiết và có thể gây log bất thường.
 * `--disk-cache-size=5000000`: giới hạn cache ~5MB, vừa đủ để tránh để lại dấu vết
 *   lớn trên disk nhưng vẫn cho phép caching cơ bản.
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
 *
 * `--kiosk`, `--start-maximized`, `--start-fullscreen`: thay đổi kích thước window
 *   theo cách không tự nhiên, dễ bị fingerprint check phát hiện automation.
 * `--headless`: hầu hết các trang đều detect headless mode, buộc phải tắt.
 * `--user-data-dir`: ta tự quản lý profile qua `--user-data-dir` trong defaultArgs,
 *   nếu để user truyền vào có thể ghi đè sai thư mục hoặc xung đột với cơ chế lock.
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
 * Xây dựng arguments Fluent từ input của user.
 *
 * **Tại sao cần lọc IGNORED_ARGS?**
 *   - `--kiosk`/`--start-maximized` làm thay đổi window bounds, nhiều script phát hiện
 *     automation qua sự khác biệt giữa screen và window size.
 *   - `--headless` bị detect gần như chắc chắn (navigator.webdriver, missing plugins...).
 *   - `--user-data-dir` do ta tự quản lý, nếu để user override sẽ phá vỡ cơ chế lock.
 *
 * **Tại sao force `--bas-force-visible-window` khi không headless?**
 *   Một số trang kiểm tra headless bằng `window.outerWidth - window.innerWidth`
 *   hoặc `window.outerHeight - window.innerHeight`. Trong headless mode, difference = 0.
 *   Flag này ép window có kích thước thật, làm cho difference > 0 giống như trình duyệt thật.
 *
 * @param options - Tuỳ chọn arguments
 * @returns Mảng arguments hoàn chỉnh để spawn Fluent
 */
export const defaultArgs = ({
  args = [],
  profile = '',
  devtools = false,
  headless = !devtools,
  extensions = [],
}: DefaultArgsOptions = {}): string[] => {
  // --- Bước 1: Tạo argument user-data-dir (do ta quản lý)
  // Đặt user-data-dir sớm nhất có thể, tránh bất kỳ flag nào khác ghi đè.
  const result: string[] = [`--user-data-dir=${profile}`];

  // --- Bước 2: Lọc và xử lý từng argument user truyền vào
  const processed = args.reduce(
    (acc: string[], arg: string): string[] => {
      const [key, value] = arg.split('=');
      // Bỏ qua các argument bị cấm để tránh thay đổi fingerprint không mong muốn
      if (!IGNORED_ARGS.some((ignored) => arg.includes(ignored))) {
        // Gộp extension nếu có nhiều --load-extension hoặc --disable-extensions-except
        // Việc gộp tránh trường hợp extension bị load nhiều lần hoặc conflict.
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
    // Headless mode: ẩn scrollbar, tắt âm thanh để giảm resource, nhưng vẫn giữ fingerprint fake
    result.push('--hide-scrollbars', '--mute-audio');
  } else {
    // --bas-force-visible-window: ép window có kích thước thật, tránh headless detection
    result.push('--bas-force-visible-window');
  }

  // --- Bước 4: Gộp với default args
  // Default args chứa các flag an toàn cho fingerprint, gộp sau cùng để có thể ghi đè
  // nếu user cần thay đổi một số flag cụ thể (như --lang).
  return processed.concat(result, DEFAULT_ARGS);
};

/**
 * Trích xuất đường dẫn profile từ options.
 *
 * **Tại sao ưu tiên userDataDir?**
 *   - `userDataDir` là thuộc tính chuẩn trong LaunchOptions của Playwright/Puppeteer,
 *     hiện đại và rõ ràng nhất để chỉ định profile.
 *   - Fallback sang `--user-data-dir` trong args để tương thích với các cách gọi cũ,
 *     khi người dùng truyền profile qua arguments thay vì option riêng.
 *   - Dùng `path.resolve()` để chuẩn hóa đường dẫn tuyệt đối, tránh lỗi relative path
 *     khi worker chạy ở thư mục khác.
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
 * **Tại sao cần kiểm tra kiểu dữ liệu tường minh?**
 *   - Người dùng có thể vô tình truyền `null`, `undefined` hoặc object rỗng.
 *   - Nếu không kiểm tra, lỗi sẽ xảy ra sâu trong engine với message khó hiểu
 *     (ví dụ: "Cannot read property 'value' of undefined").
 *   - Ném `PluginError` ngay từ đầu giúp debug nhanh và thân thiện hơn.
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
 * **Tại sao kiểm tra `launch` là function?**
 *   - Plugin cần gọi `launcher.launch(options)` để spawn trình duyệt.
 *   - Nếu `launch` không phải function, toàn bộ quá trình spawn sẽ crash.
 *   - Kiểm tra sớm tại factory method `FingerprintPlugin.create()` giúp báo lỗi
 *     ngay khi khởi tạo thay vì chờ đến lúc gọi `spawn()`.
 *
 * @param launcher - Đối tượng launcher cần kiểm tra
 * @throws PluginError nếu launcher không hợp lệ
 */
export const validateLauncher = (launcher: unknown): void => {
  if (launcher == null || typeof launcher !== 'object' || typeof (launcher as BrowserLauncher).launch !== 'function') {
    throw new PluginError('Browser launcher không được hỗ trợ - yêu cầu một object có method "launch".');
  }
};
