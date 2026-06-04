// ─── File: connector/engine.ts ─────────────────────────────────────────────
// RemoteEngine -- tải, giải nén, và IPC với engine binary (FastExecuteScript.exe).
// File-based IPC: viết JSON request, chokidar watch phản hồi.
//
//   1. Khởi tạo -- setCwd, setArgs, setTimeout
//   2. runFunction() -- start process, tạo request file, watch response
//   3. startProcess() -- verify checksum, download, extract, spawn
//   4. updateMeta() -- đọc project.xml, fetch metadata từ bablosoft
// ─────────────────────────────────────────────────────────────────────────────

import path from 'path';
import * as fs from 'fs/promises';
import { kill } from 'node:process';
import chokidar from 'chokidar';
import axios from 'axios';
import extract from 'extract-zip';
import EventEmitter from 'node:events';
import { pipeline } from 'node:stream/promises';
import { createHash, randomUUID } from 'node:crypto';
import { type ChildProcess, execFile as nodeExecFile } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import debugFactory from 'debug';
import { EngineTimeoutError, InvalidEngineError, PluginError, RequestTimeoutError } from '../errors';
import { createTimer } from '../../common/timer';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const debug = debugFactory('browser-with-fingerprints:connector:engine');

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLOSE_TIMEOUT = 60_000;
export const DEFAULT_TIMEOUT = 300_000;
export const KILL_TIMEOUT = 5_000;
export const ARCH = process.arch.includes('32') ? '32' : '64';
export const CWD = path.join(process.cwd(), 'data');

// ─── Package Root Resolution ─────────────────────────────────────────────────

/**
 * Tìm thư mục gốc của package bằng cách đi ngược từ __dirname cho đến khi
 * tìm thấy package.json có name là 'fingerprint-chromium-engine'.
 * Đảm bảo PROJECT_PATH luôn đúng bất kể cấu trúc dist/ thay đổi.
 */
function resolvePackageRoot(startDir: string): string {
  let current = startDir;

  while (true) {
    try {
      const pkg = require(path.join(current, 'package.json'));
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {
      // Chưa tìm thấy -- tiếp tục đi lên
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new PluginError('[RemoteEngine] Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.');
    }
    current = parent;
  }
}

const PACKAGE_ROOT = resolvePackageRoot(__dirname);
export const PROJECT_PATH = path.join(PACKAGE_ROOT, 'project.xml');

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Tuỳ chọn khởi tạo RemoteEngine.
 */
export interface EngineOptions {
  /** Thư mục làm việc. Mặc định dùng CWD. */
  cwd?: string;
  /** Tham số truyền vào tiến trình engine. */
  args?: string[];
  /** Timeout khởi động engine (ms). */
  engineTimeout?: string | number;
  /** Timeout chờ phản hồi (ms). */
  requestTimeout?: string | number;
  /** Hàm spawn process -- dùng để inject mock trong test. Mặc định dùng child_process.execFile. */
  execFile?: typeof nodeExecFile;
  /** Thời gian chờ process đóng (ms). Mặc định CLOSE_TIMEOUT. */
  closeTimeout?: number;
}

/**
 * Ghi đè timeout cho một lần gọi runFunction.
 */
export interface RunFunctionOptions {
  engineTimeout?: number;
  requestTimeout?: number;
}

/**
 * Metadata engine từ bablosoft.
 */
export interface EngineMeta {
  version: string;
  checksum: string;
  url: string;
}

/**
 * Kết quả từ engine sau khi thực thi hàm.
 */
export interface FunctionResult {
  error?: string;
  response?: unknown;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function checksum(filePath: string): Promise<string> {
  const reader = createReadStream(filePath);
  const hash = createHash('sha1');
  await pipeline(reader, hash);
  return hash.digest('hex');
}

export async function download(url: string, filePath: string): Promise<void> {
  const httpsUrl = url.replace(/^http:/, 'https:');
  const tmpPath = filePath + '.tmp';
  const writer = createWriteStream(tmpPath);
  try {
    try {
      const response = await axios.get(httpsUrl, { responseType: 'stream' });
      await pipeline(response.data, writer);
    } catch (err) {
      const axiosErr = err as { code?: string; response?: { status: number } };
      if (axiosErr.code === 'ERR_NETWORK' || axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ECONNRESET' || !axiosErr.response) {
        debug(`HTTPS download failed, falling back to HTTP: ${url}`);
        const response = await axios.get(url, { responseType: 'stream' });
        await pipeline(response.data, writer);
      } else {
        throw err;
      }
    }

    // Rename temp file to target, fallback to copy+unlink if cross-device
    try {
      await fs.rename(tmpPath, filePath);
    } catch (renameErr) {
      const renameError = renameErr as NodeJS.ErrnoException;
      if (renameError.code === 'EXDEV') {
        await fs.copyFile(tmpPath, filePath);
        await fs.unlink(tmpPath);
      } else {
        throw renameErr;
      }
    }
  } catch (err) {
    await fs.unlink(tmpPath).catch(() => {});
    throw err;
  }
}

/**
 * Wrapper axios request -- thử HTTPS trước, fallback HTTP nếu lỗi network.
 * Chỉ fallback khi là lỗi network (không fallback cho 4xx/5xx).
 */
export async function fetchWithFallback<T = unknown>(url: string, options?: Record<string, unknown>) {
  const httpsUrl = url.replace(/^http:/, 'https:');
  try {
    return await axios.get<T>(httpsUrl, options);
  } catch (httpsErr) {
    const axiosErr = httpsErr as { code?: string; response?: { status: number } };
    if (axiosErr.code === 'ERR_NETWORK' || axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ECONNRESET' || !axiosErr.response) {
      debug(`HTTPS failed, falling back to HTTP: ${url}`);
      return await axios.get<T>(url, options);
    }
    throw httpsErr;
  }
}

// ─── RemoteEngine ─────────────────────────────────────────────────────────────

/**
 * Engine từ xa -- quản lý vòng đời của FastExecuteScript.exe.
 * Giao tiếp qua file-based IPC: ghi JSON request, chokidar watch response.
 * Tự động tải, verify checksum, giải nén engine khi cần.
 */
export default class RemoteEngine extends EventEmitter {
  #meta: EngineMeta | null = null;
  #cwd: string | null = null;
  #args: string[] = [];
  #engineTimeout: number = DEFAULT_TIMEOUT;
  #requestTimeout: number = DEFAULT_TIMEOUT;
  #process: ChildProcess | undefined = undefined;
  #execFile: typeof nodeExecFile;
  #closeTimeout: number;

  constructor(options: EngineOptions = {}) {
    super();
    this.#execFile = options.execFile ?? nodeExecFile;
    this.#closeTimeout = options.closeTimeout ?? CLOSE_TIMEOUT;
    this.setCwd(options.cwd);
    this.setArgs(options.args);
    this.setEngineTimeout(options.engineTimeout);
    this.setRequestTimeout(options.requestTimeout);
  }

  setCwd(value?: string): void {
    this.#cwd = path.resolve(value || CWD);
  }

  setArgs(value?: string[]): void {
    this.#args = Array.isArray(value) ? value : [];
  }

  setEngineTimeout(value?: string | number): void {
    const timeout = Number(value) || 0;
    this.#engineTimeout = timeout >= 0 ? timeout : DEFAULT_TIMEOUT;
  }

  get requestTimeout(): number {
    return this.#requestTimeout;
  }

  setRequestTimeout(value?: string | number): void {
    const timeout = Number(value) || 0;
    this.#requestTimeout = timeout >= 0 ? timeout : DEFAULT_TIMEOUT;
  }

  /**
   * Gọi hàm trên engine -- tạo request file, chokidar watch response.
   * Dọn dẹp request file cũ không còn process sở hữu trước khi tạo mới.
   */
  async runFunction(
    name: string,
    params: unknown,
    { engineTimeout = this.#engineTimeout, requestTimeout = this.#requestTimeout }: RunFunctionOptions = {}
  ): Promise<FunctionResult> {
    if (!this.#meta) await this.#updateMeta();

    const engineProcess = await this.#startProcess(engineTimeout);
    debug(`Đang gọi method "${name}" (timeout: ${requestTimeout}ms)`);

    const requestDir = path.join(path.dirname(engineProcess.spawnfile), 'r');
    await fs.mkdir(requestDir, { recursive: true });

    // --- Bước 1: Dọn dẹp file request cũ không còn process cha
    for (const requestName of await fs.readdir(requestDir)) {
      try {
        const pid = Number(requestName.split('_')[0]);
        if (pid === engineProcess.pid) continue;
        kill(pid, 0);
      } catch (err: unknown) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr.code === 'ESRCH') {
          debug(`Xóa file request thừa - ${requestName}`);
          await fs.unlink(path.join(requestDir, requestName));
        }
      }
    }

    // --- Bước 2: Tạo file request JSON
    const requestPath = path.join(requestDir, `${engineProcess.pid}_${randomUUID()}.json`);
    debug(`Tạo file request mới cho hàm "${name}" - ${requestPath}`);
    await fs.writeFile(requestPath, JSON.stringify({ name, params }));

    // --- Bước 3: Watch phản hồi từ engine (file change)
    const requestWatcher = chokidar.watch(requestPath, { awaitWriteFinish: true });
    let responseStr: string | undefined;

    try {
      responseStr = await new Promise<string>((resolve, reject) => {
        let requestTimer: ReturnType<typeof createTimer> | undefined;
        let closeTimer: ReturnType<typeof createTimer> | undefined;

        if (requestTimeout) {
          requestTimer = createTimer(requestTimeout);
          requestTimer.promise.then(() => {
            reject(new RequestTimeoutError(`Hết thời gian chờ khi gọi method "${name}".`));
          });
        }

        const closeHandler = () => {
          closeTimer = createTimer(this.#closeTimeout);
          closeTimer.promise.then(() => {
            debug('Tiến trình engine đã đóng trong lúc chờ phản hồi');
            resolve('');
          });
        };

        requestWatcher.on('change', async () => {
          const content = await fs.readFile(requestPath, 'utf8');
          debug('Đã nhận kết quả từ engine thành công');

          requestTimer?.clear();
          closeTimer?.clear();
          engineProcess.off('close', closeHandler);

          await fs.unlink(requestPath);
          resolve(content);
        });

        engineProcess.once('close', closeHandler);
      });
    } finally {
      await requestWatcher.close();
    }

    // --- Bước 4: Parse kết quả JSON
    if (!responseStr) return { error: 'Engine process closed unexpectedly' };
    try {
      return JSON.parse(responseStr) as FunctionResult;
    } catch {
      return { error: 'Invalid response format from engine' };
    }
  }

  /**
   * Khởi tạo tiến trình engine -- download + extract + spawn.
   * Kiểm tra checksum, xoá engine cũ nếu checksum không khớp.
   */
  async #startProcessInternal(): Promise<ChildProcess> {
    const scriptDir = path.join(this.#cwd!, 'script', this.#meta!.version);
    const engineDir = path.join(this.#cwd!, 'engine', this.#meta!.version);
    const zipPath = path.join(engineDir, `FastExecuteScript.x${ARCH}.zip`);

    // --- Bước 1: Kiểm tra checksum -- xoá engine cũ nếu sai
    if (this.#meta && (await exists(zipPath))) {
      if (this.#meta.checksum !== (await checksum(zipPath))) {
        await fs.rm(engineDir, { recursive: true, force: true });
        debug('Đã xóa engine bị lỗi (sai checksum)');
      }
    }

    // --- Bước 2: Download engine nếu chưa có
    if (!(await exists(engineDir))) {
      this.emit('beforeDownload');
      await fs.mkdir(engineDir, { recursive: true });
      await download(this.#meta!.url, zipPath);
      debug('Engine tải xuống thành công');
    }

    // --- Bước 3: Giải nén engine nếu chưa có
    if (!(await exists(scriptDir))) {
      this.emit('beforeExtract');
      await fs.mkdir(scriptDir, { recursive: true });
      await extract(zipPath, { dir: scriptDir });
      debug('Engine giải nén thành công');
    }

    // --- Bước 4: Copy project.xml + tạo file cấu hình
    await fs.copyFile(PROJECT_PATH, path.join(scriptDir, 'project.xml'));
    await fs.writeFile(path.join(scriptDir, 'worker_command_line.txt'), '--mock-connector');
    await fs.writeFile(path.join(scriptDir, 'settings.ini'), 'RunProfileRemoverImmediately=true');

    debug(`Đang khởi chạy tiến trình engine (cwd: ${scriptDir})`);

    // --- Bước 5: Spawn FastExecuteScript.exe
    return new Promise<ChildProcess>((resolve, reject) => {
      const proc = this.#execFile(
        path.join(scriptDir, 'FastExecuteScript.exe'),
        ['--silent', ...this.#args],
        { cwd: scriptDir },
        (error) => {
          if (error) {
            reject(new InvalidEngineError(`Không thể khởi chạy tiến trình engine (mã lỗi: ${error.code})`));
          }
        }
      );
      this.#process = proc;
      resolve(proc);
    });
  }

  /**
   * Kiểm tra tiến trình engine còn sống hay không.
   * Dùng signal 0 (không gửi signal thật) để kiểm tra PID tồn tại.
   */
  #isProcessAlive(proc?: ChildProcess): boolean {
    if (!proc) return false;
    if (proc.killed) return false;
    try {
      process.kill(proc.pid!, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kill engine process -- dừng FastExecuteScript.exe và đợi process thoát hẳn.
   * Dùng timeout + SIGKILL fallback để tránh treo vô hạn.
   * Cleaner sẽ không chạy khi process còn ghi file -- tránh EBUSY trên Windows.
   *
   * @param timeout - Thời gian chờ process thoát (ms), mặc định KILL_TIMEOUT
   */
  async kill(timeout = KILL_TIMEOUT): Promise<void> {
    if (!this.#process || this.#process.killed) return;
    const proc = this.#process;

    const exitPromise = new Promise<void>((resolve) => {
      proc.once('exit', () => resolve());
    });

    // --- Bước 1: Kiểm tra process đã exit trước khi gửi tín hiệu
    // Nếu process đã thoát trước khi listener 'exit' được đăng ký,
    // exitPromise sẽ không bao giờ resolve -- gây treo vô hạn.
    if (proc.exitCode !== null) {
      this.#process = undefined;
      return;
    }

    proc.kill();

    const sigkillTimer = createTimer(timeout);
    sigkillTimer.promise.then(() => {
      proc.kill('SIGKILL');
    });

    await exitPromise;
    sigkillTimer.clear();
    this.#process = undefined;
  }

  /**
   * Lấy tiến trình engine đang chạy, hoặc spawn mới nếu chưa có.
   * Cache process để tránh spawn lại mỗi lần gọi API.
   * Chỉ áp dụng timeout khi thực sự spawn process mới.
   */
  async #startProcess(timeout?: number): Promise<ChildProcess> {
    if (this.#isProcessAlive(this.#process)) {
      debug('Tái sử dụng tiến trình engine hiện tại');
      return this.#process!;
    }

    if (!timeout) return await this.#startProcessInternal();

    let timer: NodeJS.Timeout | null = null;
    const engineProcess = await Promise.race<ChildProcess>([
      this.#startProcessInternal(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new EngineTimeoutError('Hết thời gian chờ khi khởi tạo engine plugin.')),
          timeout
        ).unref();
      }),
    ]);

    if (timer) clearTimeout(timer);
    return engineProcess;
  }

  /**
   * Đọc metadata engine -- từ cache hoặc fetch từ bablosoft.
   * Cache theo version_ARCH.json để tránh request mỗi lần.
   */
  async #updateMeta(): Promise<void> {
    const project = await fs.readFile(PROJECT_PATH, 'utf8');
    const versionMatch = project.match(/<EngineVersion>(\d+\.\d+\.\d+)<\/EngineVersion>/);
    if (!versionMatch) throw new InvalidEngineError('Không thể đọc phiên bản Engine từ project.xml');

    const version = versionMatch[1];
    debug(`Cập nhật metadata cho engine (arch: ${ARCH}, version: ${version})`);

    const url = `https://bablosoft.com/distr/FastExecuteScript${ARCH}/${version}/FastExecuteScript.x${ARCH}.zip.meta.json`;
    const metaPath = path.join(this.#cwd!, `${version}_${ARCH}.json`);

    if (await exists(metaPath)) {
      debug(`Sử dụng metadata đã lưu tại ${metaPath}`);
      this.#meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    } else {
      debug(`Yêu cầu metadata mới từ ${url}`);
      const { data } = await fetchWithFallback<{ Checksum: string; Url: string }>(url);
      this.#meta = {
        checksum: data.Checksum,
        url: data.Url,
        version,
      };

      await fs.mkdir(path.dirname(metaPath), { recursive: true });
      await fs.writeFile(metaPath, JSON.stringify(this.#meta));
    }
  }
}
