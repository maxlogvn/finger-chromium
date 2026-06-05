// ─── File: launcher/index.ts ───────────────────────────────────────────────
// Browser Launcher -- spawn Chromium child process, phát hiện DevTools URL,
// và cung cấp cơ chế đóng process tree.
//
//   1. Spawn worker.exe với arguments (bao gồm remote-debugging-port)
//   2. Parse DevTools listening URL từ stderr/stdout (timeout nếu không thấy)
//   3. Trả về Browser object với close() dùng taskkill /T /F để dọn sạch process tree
// ─────────────────────────────────────────────────────────────────────────────

import path from 'node:path';
import { createInterface } from 'node:readline';
import { exec, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

import { PluginError } from '../errors.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Đối tượng điều khiển trình duyệt đã launch. */
export interface Browser {
  /** Tiến trình child process của Chromium. */
  process: ChildProcess;
  /** Cổng DevTools đang lắng nghe. */
  port: number;
  /** URL DevTools (vd: http://localhost:9222). */
  url: string;

  /**
   * Cấu hình thêm sau khi launch (hiện là no-op, dành cho mở rộng sau).
   * @returns Promise hoàn thành khi cấu hình xong.
   */
  configure(): Promise<void>;

  /**
   * Đóng trình duyệt và dọn dẹp toàn bộ process tree.
   * Dùng `taskkill /T /F` trên Windows để đảm bảo không còn process con.
   * Nếu lệnh taskkill thất bại (ví dụ không có quyền), fallback về `childProcess.kill()`.
   */
  close(): Promise<void>;
}

/** Tuỳ chọn khi launch trình duyệt. */
export interface LaunchOptions {
  /** Cổng remote debugging (0 để chọn ngẫu nhiên). */
  debuggingPort?: number;
  /** Thư mục user data (profile). Nếu không set, Chromium dùng profile tạm. */
  userDataDir?: string;
  /** Chạy headless hay không (mặc định false). */
  headless?: boolean;
  /** Timeout chờ DevTools URL (ms). Mặc định 30000. */
  timeout?: number;
  /** Các argument dòng lệnh bổ sung cho Chromium. */
  args?: string[];
  /** Đường dẫn đến executable Chromium. Bắt buộc phải có. */
  executablePath: string;
}

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Spawn Chromium và chờ DevTools listening URL.
 *
 * **Tại sao parse từ stderr lẫn stdout?** Một số phiên bản Chromium ghi DevTools URL
 * vào stderr, số khác ghi vào stdout. Đọc cả hai đảm bảo tương thích.
 *
 * **Tại sao dùng `taskkill /T /F`?** Chromium spawn nhiều process con (GPU, renderer, ...).
 * Kill đơn lẻ process cha sẽ để lại process con chạy nền. `taskkill /T /F` giết cả cây
 * process, tránh rò rỉ tài nguyên.
 */
export const launch = async ({
  args = [],
  timeout = 30000,
  userDataDir = '',
  debuggingPort = 0,
  executablePath,
}: LaunchOptions): Promise<Browser> => {
  if (!executablePath) {
    throw new PluginError('[BrowserLauncher] executablePath là bắt buộc.');
  }

  // --- Bước 1: Tạo argument list và spawn child process
  const resolvedArgs = userDataDir ? [...args, `--user-data-dir=${path.resolve(userDataDir)}`] : [...args];
  const childProcess = spawn(executablePath, [...resolvedArgs, `--remote-debugging-port=${debuggingPort}`], {
    detached: false,
    shell: false,
    // --- Tại sao inherit stdio? Cần đọc stderr/stdout để parse DevTools URL.
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let isClosed = false; // Tránh gọi taskkill nhiều lần

  // --- Bước 2: Parse DevTools listening URL từ stderr/stdout (timeout)
  const url = await new Promise<string>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeout) {
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        reject(new PluginError(`Timed out after ${timeout}ms while waiting for DevTools URL.`));
      }, timeout);
    }

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      readlineStderr?.close();
      readlineStdout?.close();
    };

    const readlineStderr = createInterface({ input: childProcess.stderr! });
    const readlineStdout = createInterface({ input: childProcess.stdout! });

    const onLine = (line: string) => {
      // --- Regex bắt DevTools listening URL (cả dạng có và không có giao thức)
      const match = line.match(/DevTools listening on (wss?:\/\/\S+)/);
      if (match) {
        cleanup();
        resolve(match[1]);
      }
    };

    readlineStderr.on('line', onLine);
    readlineStdout.on('line', onLine);

    // Xử lý trường hợp child process chết trước khi có URL
    childProcess.once('exit', (code, signal) => {
      cleanup();
      reject(
        new PluginError(`Child process exited before providing DevTools URL. Exit code: ${code}, signal: ${signal}`)
      );
    });

    childProcess.once('error', (err) => {
      cleanup();
      reject(new PluginError(`Failed to spawn browser: ${err.message}`));
    });
  });

  // --- Bước 3: Parse port từ URL
  let port: number;
  try {
    port = Number(new URL(url).port);
  } catch {
    throw new PluginError(`Invalid DevTools URL received: ${url}`);
  }

  // --- Bước 4: Tạo close method (dùng taskkill trên Windows)
  const close = async (): Promise<void> => {
    if (isClosed) return;
    isClosed = true;

    if (!childProcess.pid || childProcess.killed) return;

    // Dùng taskkill để kill toàn bộ process tree (Windows-specific)
    // Fallback: nếu lệnh thất bại (ví dụ không tìm thấy taskkill hoặc quyền), dùng .kill()
    return new Promise<void>((resolve) => {
      exec(`taskkill /pid ${childProcess.pid} /T /F`, (err, _stdout, _stderr) => {
        if (err) {
          console.error(`[BrowserLauncher] taskkill failed (${err.message}), falling back to childProcess.kill()`);
          childProcess.kill('SIGKILL');
        } else {
          // Log success nếu cần debug
          if (process.env.DEBUG?.includes('browser-with-fingerprints:launcher')) {
            console.debug(`[BrowserLauncher] Killed process tree PID ${childProcess.pid}`);
          }
        }
        resolve();
      });
    });
  };

  return {
    url,
    port,
    close,
    process: childProcess,
    configure: async () => {
      // No-op hiện tại, dành cho tương lai (ví dụ inject fingerprint qua CDP)
    },
  };
};
