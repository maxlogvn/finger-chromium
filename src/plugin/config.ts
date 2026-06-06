// ─── File: plugin/config.ts ────────────────────────────────────────────────
// Cấu hình browser engine -- resize viewport và đồng bộ availWidth/availHeight
// vào file .ini của engine.
//
//   Việc cập nhật trực tiếp file .ini thay vì dùng CDP để set screen avail
//   là do engine worker đọc các giá trị này từ file cấu hình trước khi khởi tạo
//   cửa sổ; thay đổi qua CDP sau khi browser đã chạy sẽ không có hiệu lực.
//   1. ConfigManager class -- sở hữu AsyncLock riêng (per-instance)
//   2. configure() -- đăng ký cleanup + resize viewport
//   3. synchronize() -- cập nhật availWidth/availHeight vào .ini
// ─────────────────────────────────────────────────────────────────────────────

import AsyncLock from 'async-lock';
import { setViewport } from './browser';
import { sleep } from '../common/timer';
import { readFile, writeFile } from 'fs/promises';
import type { Browser } from './launcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViewportBounds {
  width?: number;
  height?: number;
  [key: string]: number | undefined;
}

type SyncWrapper = <T>(fn: () => Promise<T> | T) => Promise<T>;
type CleanupFn = (browser: Browser) => void | Promise<void>;
type ActionFn = () => Promise<void> | void;

interface ConfigureOptions {
  width?: number;
  height?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Khoảng thời gian chờ mặc định giữa hai lần ghi file .ini (ms).
 * Chọn 500ms vì đủ để engine kịp đọc file sau khi ghi lần đầu,
 * nhưng không quá dài làm chậm quá trình launch (tổng thời gian ~1s).
 */
const DEFAULT_POLL_INTERVAL = 500;

/**
 * Khoảng thời gian chờ tối thiểu cho phép (ms).
 * Không cho phép nhỏ hơn 100ms vì:
 * - Ghi file quá nhanh có thể khiến engine chưa kịp đọc file đã bị ghi đè.
 * - Tránh vòng lặp busy-waiting gây tốn CPU.
 */
const MIN_POLL_INTERVAL = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate và clamp pollInterval về giá trị hợp lệ.
 * Âm hoặc NaN → default 500ms, < 100ms → clamp lên 100ms.
 * Dùng interval ngắn hơn giúp synchronize nhanh hơn (từ 4s xuống ~1s mặc định),
 * nhưng không được quá ngắn để tránh race condition với engine worker.
 */
export const getValidPollInterval = (interval: number | undefined): number => {
  if (typeof interval !== 'number' || Number.isNaN(interval) || interval < 0) {
    return DEFAULT_POLL_INTERVAL;
  }
  return Math.max(interval, MIN_POLL_INTERVAL);
};

// ─── ConfigManager ────────────────────────────────────────────────────────────

/**
 * Quản lý cấu hình browser engine cho một instance.
 * Mỗi instance sở hữu AsyncLock riêng để tránh contention
 * khi nhiều instance gọi synchronize() song song.
 *
 * **Tại sao cần lock riêng?** Nếu dùng lock toàn cục, hai profile khác nhau
 * sẽ phải chờ lẫn nhau dù không xung đột. Lock per-instance dựa trên `id`
 * đảm bảo chỉ đồng bộ trên cùng một file cấu hình.
 */
export class ConfigManager {
  #lock = new AsyncLock();

  /**
   * Cấu hình browser sau spawn -- đăng ký cleanup handler và resize viewport.
   *
   * **Tại sao dùng `process.once('exit')` thay vì `browser.on('closed')`?**
   *   - Browser process có thể bị kill bất ngờ (SIGKILL, crash) và không emit event 'closed'.
   *   - `process.on('exit')` đảm bảo cleanup luôn chạy trước khi Node.js process kết thúc,
   *     giúp giải phóng file lock và xóa thư mục tạm ngay cả khi browser chết đột ngột.
   *
   * **Tại sao gọi `setViewport` bên trong `browser.configure`?**
   *   - Một số launcher (vd: Playwright) yêu cầu gọi configure trước khi trang được tải,
   *     nếu không viewport sẽ bị set sau khi trang đã render → layout bị sai.
   *   - Gán `browser.configure` dưới dạng async function cho phép custom launcher override
   *     hoặc gọi thêm logic khác mà không phá vỡ luồng chính.
   */
  async configure(
    cleanup: CleanupFn,
    browser: Browser,
    bounds: ConfigureOptions = {},
    sync: SyncWrapper = async (fn) => fn()
  ): Promise<void> {
    browser.process.once('exit', () => cleanup(browser));
    browser.configure = async (): Promise<void> => {
      if (bounds.width && bounds.height) {
        await sync(() => setViewport(browser, bounds as Required<ConfigureOptions>));
      }
    };
    await browser.configure();
  }

  /**
   * Đồng bộ availWidth/availHeight vào file .ini của engine.
   *
   * **Tại sao cần reset về `BAS_NOT_SET` trước rồi mới set giá trị thật?**
   *   - Engine worker đọc file .ini ngay khi khởi tạo window. Nếu chỉ set một lần,
   *     giá trị availWidth/availHeight có thể bị bỏ qua nếu engine đã đọc trước đó.
   *   - Reset về `BAS_NOT_SET` buộc engine bỏ qua giá trị cũ, sau đó ghi giá trị mới
   *     và `sleep()` đảm bảo engine có cơ hội đọc lại file sau khi ghi.
   *
   * **Tại sao dùng `sleep(actualPollInterval)` giữa hai lần ghi?**
   *   - Engine chạy trong process riêng, không có cơ chế notify khi file thay đổi.
   *   - Delay ngắn (mặc định 500ms) đủ để engine poll file và áp dụng thay đổi.
   *
   * **Tại sao dùng regex thay vì parse INI?**
   *   - File .ini của engine có cú pháp đơn giản, mỗi key/value trên một dòng.
   *   - Dùng regex tránh phải thêm thư viện parse INI và nhanh hơn.
   *   - Pattern `${iniKey}=(.+)` bắt được dòng chứa key, kể cả khi value có dấu '='.
   *
   * @param id - Unique ID của engine instance, dùng để tạo đường dẫn file .ini
   * @param pwd - Thư mục làm việc của engine (chứa thư mục `s/`)
   * @param bounds - Đối tượng chứa `width` và `height` (cho availWidth/availHeight)
   * @param action - Hành động chạy giữa hai lần ghi file (thường là set viewport qua CDP)
   * @param pollInterval - Thời gian chờ giữa các lần ghi (ms), nếu không hợp lệ dùng mặc định
   */
  async synchronize(
    id: string,
    pwd: string,
    bounds: ViewportBounds = {},
    action: ActionFn = async () => {},
    pollInterval?: number
  ): Promise<void> {
    const configPath = `${pwd}/s/${id}1.ini`;
    const actualPollInterval = getValidPollInterval(pollInterval);
    // Lock theo `id` để hai instance khác nhau không block lẫn nhau,
    // nhưng cùng một profile sẽ được xử lý tuần tự tránh ghi đè.
    await this.#lock.acquire(id, async () => {
      let configContent = await readFile(configPath, 'utf8');
      // reset = true: set BAS_NOT_SET; reset = false: set giá trị thật từ bounds
      for (const reset of [true, false]) {
        if (!reset) {
          // Chạy action (set viewport) sau khi đã reset, trước khi set giá trị thật
          await Promise.resolve(action());
        }
        for (const [iniKey, boundsKey] of [
          ['availWidth', 'width'],
          ['availHeight', 'height'],
        ] as const) {
          configContent = configContent.replace(new RegExp(`${iniKey}=(.+)`), (): string => {
            const value = reset ? 'BAS_NOT_SET' : (bounds[boundsKey] ?? 'BAS_NOT_SET');
            return `${iniKey}=${value}`;
          });
        }
        await writeFile(configPath, configContent);
        // Chờ đủ lâu để engine kịp đọc file sau khi ghi
        await sleep(actualPollInterval);
      }
    });
  }
}
