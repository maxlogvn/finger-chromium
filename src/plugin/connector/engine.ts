import path from 'path';
import * as fs from 'fs/promises';
import { kill } from 'node:process';
import chokidar from 'chokidar';
import axios from 'axios';
import extract from 'extract-zip';
import EventEmitter from 'node:events';
import { pipeline } from 'node:stream/promises';
import { createHash, randomUUID } from 'node:crypto';
import { type ChildProcess, execFile } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import debugFactory from 'debug';
import { EngineTimeoutError, InvalidEngineError, RequestTimeoutError } from '../errors';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const debug = debugFactory('browser-with-fingerprints:connector:engine');

export const CLOSE_TIMEOUT = 60_000;
export const DEFAULT_TIMEOUT = 300_000;
export const ARCH = process.arch.includes('32') ? '32' : '64';
export const CWD = path.join(process.cwd(), 'data');

// ─── Package Root Resolution ────────────────────────────────────────────────

/**
 * Tìm thư mục gốc của package bằng cách đi ngược lên từ __dirname
 * cho đến khi tìm thấy package.json có name là 'fingerprint-chromium-engine'.
 *
 * Cách này đảm bảo PROJECT_PATH luôn trỏ đúng vào package,
 * bất kể cấu trúc dist/ hay số cấp thư mục thay đổi sau khi build.
 */
function resolvePackageRoot(startDir: string): string {
  let current = startDir;

  while (true) {
    try {
      const pkg = require(path.join(current, 'package.json'));
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {
      // Chưa tìm thấy package.json hợp lệ, tiếp tục đi lên
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('[RemoteEngine] Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.');
    }
    current = parent;
  }
}

const PACKAGE_ROOT = resolvePackageRoot(__dirname);
export const PROJECT_PATH = path.join(PACKAGE_ROOT, 'project.xml');

// ─── Interface ─────────────────────────────────────────────────────────────

/**
 * Tùy chọn khởi tạo RemoteEngine.
 */
export interface EngineOptions {
  /** Thư mục làm việc của engine. Mặc định dùng `CWD` từ config. */
  cwd?: string;
  /** Danh sách tham số truyền vào tiến trình engine khi khởi chạy. */
  args?: string[];
  /** Thời gian tối đa chờ engine khởi động (ms). */
  engineTimeout?: string | number;
  /** Thời gian tối đa chờ phản hồi từ một lần gọi hàm (ms). */
  requestTimeout?: string | number;
}

/**
 * Tùy chọn timeout cho một lần gọi `runFunction`.
 * Ghi đè giá trị mặc định được thiết lập trong constructor.
 */
export interface RunFunctionOptions {
  /** Ghi đè `engineTimeout` cho lần gọi này. */
  engineTimeout?: number;
  /** Ghi đè `requestTimeout` cho lần gọi này. */
  requestTimeout?: number;
}

/**
 * Metadata của engine tải về từ bablosoft.
 */
export interface EngineMeta {
  /** Phiên bản engine, đọc từ `project.xml`. */
  version: string;
  /** SHA1 checksum dùng để kiểm tra tính toàn vẹn của file zip. */
  checksum: string;
  /** URL tải file zip của engine. */
  url: string;
}

/**
 * Kết quả trả về từ engine sau khi thực thi một hàm.
 */
export interface FunctionResult {
  /** Thông báo lỗi nếu engine thực thi thất bại. */
  error?: string;
  /** Dữ liệu trả về khi thực thi thành công. */
  response?: unknown;
  [key: string]: unknown;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checksum(filePath: string): Promise<string> {
  const reader = createReadStream(filePath);
  const hash = createHash('sha1');
  await pipeline(reader, hash);
  return hash.digest('hex');
}

async function download(url: string, filePath: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'stream' });
  const writer = createWriteStream(filePath);
  await pipeline(response.data, writer);
}

// ─── Class Definition ───────────────────────────────────────────────────────

export default class RemoteEngine extends EventEmitter {
  #meta: EngineMeta | null = null;
  #cwd: string | null = null;
  #args: string[] = [];
  #engineTimeout: number = DEFAULT_TIMEOUT;
  #requestTimeout: number = DEFAULT_TIMEOUT;

  constructor(options: EngineOptions = {}) {
    super();
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

    // Dọn dẹp file request cũ không còn tiến trình cha
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

    const requestPath = path.join(requestDir, `${engineProcess.pid}_${randomUUID()}.json`);
    debug(`Tạo file request mới cho hàm "${name}" - ${requestPath}`);
    await fs.writeFile(requestPath, JSON.stringify({ name, params }));

    const requestWatcher = chokidar.watch(requestPath, { awaitWriteFinish: true });
    let responseStr: string | undefined;

    try {
      responseStr = await new Promise<string>((resolve, reject) => {
        let closeTimer: NodeJS.Timeout | null = null;
        let requestTimer: NodeJS.Timeout | null = null;

        if (requestTimeout) {
          requestTimer = setTimeout(() => {
            reject(new RequestTimeoutError(`Hết thời gian chờ khi gọi method "${name}".`));
          }, requestTimeout).unref();
        }

        const closeHandler = () => {
          closeTimer = setTimeout(() => {
            debug('Tiến trình engine đã đóng trong lúc chờ phản hồi');
            resolve('');
          }, CLOSE_TIMEOUT);
        };

        requestWatcher.on('change', async () => {
          const content = await fs.readFile(requestPath, 'utf8');
          debug('Đã nhận kết quả từ engine thành công');

          if (requestTimer) clearTimeout(requestTimer);
          if (closeTimer) clearTimeout(closeTimer);
          engineProcess.off('close', closeHandler);

          await fs.unlink(requestPath);
          resolve(content);
        });

        engineProcess.once('close', closeHandler);
      });
    } finally {
      await requestWatcher.close();
    }

    if (!responseStr) return { error: 'Engine process closed unexpectedly' };
    try {
      return JSON.parse(responseStr) as FunctionResult;
    } catch {
      return { error: 'Invalid response format from engine' };
    }
  }

  async #startProcessInternal(): Promise<ChildProcess> {
    const scriptDir = path.join(this.#cwd!, 'script', this.#meta!.version);
    const engineDir = path.join(this.#cwd!, 'engine', this.#meta!.version);
    const zipPath = path.join(engineDir, `FastExecuteScript.x${ARCH}.zip`);

    if (this.#meta && (await exists(zipPath))) {
      if (this.#meta.checksum !== (await checksum(zipPath))) {
        await fs.rm(engineDir, { recursive: true, force: true });
        debug('Đã xóa engine bị lỗi (sai checksum)');
      }
    }

    if (!(await exists(engineDir))) {
      this.emit('beforeDownload');
      await fs.mkdir(engineDir, { recursive: true });
      await download(this.#meta!.url, zipPath);
      debug('Engine tải xuống thành công');
    }

    if (!(await exists(scriptDir))) {
      this.emit('beforeExtract');
      await fs.mkdir(scriptDir, { recursive: true });
      await extract(zipPath, { dir: scriptDir });
      debug('Engine giải nén thành công');
    }

    await fs.copyFile(PROJECT_PATH, path.join(scriptDir, 'project.xml'));
    await fs.writeFile(path.join(scriptDir, 'worker_command_line.txt'), '--mock-connector');
    await fs.writeFile(path.join(scriptDir, 'settings.ini'), 'RunProfileRemoverImmediately=true');

    debug(`Đang khởi chạy tiến trình engine (cwd: ${scriptDir})`);

    return new Promise<ChildProcess>((resolve, reject) => {
      const proc = execFile(
        path.join(scriptDir, 'FastExecuteScript.exe'),
        ['--silent', ...this.#args],
        { cwd: scriptDir },
        (error) => {
          if (error) {
            reject(new InvalidEngineError(`Không thể khởi chạy tiến trình engine (mã lỗi: ${error.code})`));
          }
        }
      );
      resolve(proc);
    });
  }

  async #startProcess(timeout?: number): Promise<ChildProcess> {
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

  async #updateMeta(): Promise<void> {
    const project = await fs.readFile(PROJECT_PATH, 'utf8');
    const versionMatch = project.match(/<EngineVersion>(\d+\.\d+\.\d+)<\/EngineVersion>/);
    if (!versionMatch) throw new Error('Không thể đọc phiên bản Engine từ project.xml');

    const version = versionMatch[1];
    debug(`Cập nhật metadata cho engine (arch: ${ARCH}, version: ${version})`);

    const url = `http://bablosoft.com/distr/FastExecuteScript${ARCH}/${version}/FastExecuteScript.x${ARCH}.zip.meta.json`;
    const metaPath = path.join(this.#cwd!, `${version}_${ARCH}.json`);

    if (await exists(metaPath)) {
      debug(`Sử dụng metadata đã lưu tại ${metaPath}`);
      this.#meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    } else {
      debug(`Yêu cầu metadata mới từ ${url}`);
      const { data } = await axios.get<{ Checksum: string; Url: string }>(url);
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
