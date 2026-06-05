// ─── File: plugin/cleaner.ts ───────────────────────────────────────────────
// Dọn dẹp file tạm của engine -- xoá các file không còn process sở hữu.
// Dùng proper-lockfile để tránh xoá file đang dùng.
//
//   1. watch() -- đăng ký thư mục cần dọn dẹp, khởi động timer 15s
//   2. ignore() -- lock file (không xoá) khi process đang chạy
//   3. include() -- unlock file (cho phép xoá) khi process kết thúc
//   4. cleanup interval -- quét và xoá file hết hạn
// ─────────────────────────────────────────────────────────────────────────────

// Node.js built-in
import path from 'node:path';
import { rm } from 'fs/promises';

// Third-party
import fg from 'fast-glob';
import lock from 'proper-lockfile';
import createDebug from 'debug';

const debug = createDebug('browser-with-fingerprints:cleaner');

// ─── Constants ────────────────────────────────────────────────────────────────
const CLEANUP_INTERVAL = 15_000;

/**
 * Trả về danh sách đường dẫn tương đối (so với thư mục gốc) cần lock/unlock.
 * Các file này là target của engine trong quá trình chạy.
 */
const getLockablePaths = (pid: string, id: string): string[] => [`t/${pid}`, `s/${id}.ini`, `s/${id}1.ini`];

// ─── SettingsCleaner Class ───────────────────────────────────────────────────

/**
 * Quản lý lock/unlock file tạm của engine để tránh xoá nhầm khi còn dùng.
 * Khởi động timer 15s quét và dọn dẹp các file không còn process sở hữu.
 *
 * Lý do: Engine tạo file tạm theo process (thư mục `t/`) và session (thư mục `s/`).
 * Nếu process crash hoặc không unlock kịp, các file cũ sẽ tích tụ. Cleaner này
 * chỉ xoá file khi chắc chắn không còn process nào giữ lock.
 */
export class SettingsCleaner {
  #timer: ReturnType<typeof setInterval> | null = null;
  #folders: string[] = [];

  /**
   * Lock file tạm của process đang chạy.
   * Ngăn cleaner xoá file khi process chưa kết thúc.
   *
   * @param folder - Thư mục gốc chứa file tạm (engine working directory)
   * @param pid - Process ID của browser engine
   * @param id - Session ID
   */
  async ignore(folder: string, pid: string, id: string): Promise<void> {
    await this.#toggleLock(true, folder, pid, id);
  }

  /**
   * Unlock file tạm sau khi process kết thúc.
   * Cho phép cleaner xoá file trong lần quét tiếp theo.
   *
   * @param folder - Thư mục gốc chứa file tạm
   * @param pid - Process ID của browser engine
   * @param id - Session ID
   */
  async include(folder: string, pid: string, id: string): Promise<void> {
    await this.#toggleLock(false, folder, pid, id);
  }

  /**
   * Đăng ký thư mục cần dọn dẹp.
   * Khởi động timer quét nếu chưa có timer nào đang chạy.
   *
   * @param folder - Thư mục cần theo dõi và dọn dẹp
   * @returns `this` để có thể chain với các phương thức khác
   */
  watch(folder: string): this {
    // --- Bước 1: Thêm thư mục vào danh sách nếu chưa tồn tại
    if (!this.#folders.includes(folder)) {
      this.#folders.push(folder);
    }

    // --- Bước 2: Khởi động timer ngay lập tức nếu chưa có
    if (!this.#timer) {
      // Gọi cleanup một lần ngay để xoá những file cũ trước khi timer bắt đầu
      void this.#cleanup();
      this.#timer = setInterval(() => void this.#cleanup(), CLEANUP_INTERVAL).unref();
    }
    return this;
  }

  /**
   * Dừng toàn bộ cleaner.
   * Clear interval, unlock tất cả file đang bị lock, reset danh sách thư mục.
   */
  async stop(): Promise<void> {
    // --- Bước 1: Dừng timer nếu đang chạy
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }

    // --- Bước 2: Quét tất cả thư mục đã đăng ký, tìm và unlock các file còn lock
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

    // --- Bước 3: Reset danh sách thư mục
    this.#folders = [];
  }

  // ─── Private Methods ────────────────────────────────────────────────────────

  /**
   * Thực hiện lock hoặc unlock trên các đường dẫn liên quan đến một process/session.
   * Bỏ qua lỗi ENOENT (file không tồn tại) vì có thể file chưa được tạo.
   *
   * @param shouldLock - `true` để lock, `false` để unlock
   * @param folder - Thư mục gốc
   * @param pid - Process ID
   * @param id - Session ID
   */
  async #toggleLock(shouldLock: boolean, folder: string, pid: string, id: string): Promise<void> {
    // --- Bước 1: Lấy danh sách các đường dẫn cần lock/unlock
    const lockablePaths = getLockablePaths(pid, id);

    for (const relativePath of lockablePaths) {
      const fullPath = path.join(folder, relativePath);
      try {
        // --- Bước 2: Gọi lock hoặc unlock tuỳ theo tham số
        await lock[shouldLock ? 'lock' : 'unlock'](fullPath, {
          onCompromised: () => {
            debug(`File lock tại đường dẫn ${fullPath} không được cập nhật.`);
          },
        });
      } catch (err) {
        const nodeErr = err as NodeJS.ErrnoException;
        // ENOENT: file chưa tồn tại -> không cần lock/unlock, bỏ qua
        if (nodeErr.code !== 'ENOENT') throw err;
      }
    }
  }

  /**
   * Quét tất cả thư mục đã đăng ký và xoá các file hết hạn (mtime > CLEANUP_INTERVAL)
   * và không bị bất kỳ process nào lock.
   *
   * Lý do: File đang được process dùng sẽ có lock. Chỉ xoá file khi chắc chắn không còn ai giữ lock,
   * dựa vào proper-lockfile. Kiểm tra lock trên file `.ini` đối với file `.txt` vì engine có thể
   * tạo cặp `.txt` (temporary) và `.ini` (lock gốc).
   */
  async #cleanup(): Promise<void> {
    for (const folder of this.#folders) {
      // --- Bước 1: Lấy tất cả file/thư mục trong `t/` và `s/`
      const pattern = path.join(folder, `{t,s}`, '*');
      const entries = await fg(pattern, { stats: true, onlyFiles: false });

      for (const { path: entryPath, stats } of entries) {
        // --- Bước 2: Bỏ qua file mới tạo (chưa đủ thời gian CLEANUP_INTERVAL)
        if (!stats || Date.now() - stats.mtimeMs <= CLEANUP_INTERVAL) continue;

        // --- Bước 3: Xác định đường dẫn dùng để kiểm tra lock.
        // Với file .txt trong thư mục `s/`, engine thực chất lock trên file .ini cùng tên.
        // Nếu không tìm thấy file .ini -> coi như không lock (xoá được).
        const parsedPath = path.parse(entryPath);
        const checkPath =
          parsedPath.ext === '.txt' && path.basename(parsedPath.dir) === 's'
            ? path.format({ ...parsedPath, base: undefined, ext: '.ini' })
            : entryPath;

        // --- Bước 4: Kiểm tra lock, nếu đang bị lock thì bỏ qua
        const isLocked = await lock.check(checkPath).catch(() => false);
        if (isLocked) continue;

        // --- Bước 5: Xoá file/thư mục
        await rm(entryPath, { recursive: true, force: true });
      }
    }
  }
}

// ─── Export ─────────────────────────────────────────────────────────────────

/**
 * @deprecated Từ v1.x. Không còn được production code sử dụng.
 * Dùng `new SettingsCleaner()` để tạo instance riêng.
 * Sẽ bị xoá ở major version 2.0.
 */
export default new SettingsCleaner();
