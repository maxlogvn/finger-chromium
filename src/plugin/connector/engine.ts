// ─── File: engine.ts ─────────────────────────────────────────────────────
// RemoteEngine – quản lý vòng đời của BAS engine process.
//
//   1. Khởi tạo với options (cwd, timeout, args)
//   2. Download/extract engine ZIP
//   3. Start process với file-based IPC
//   4. runFunction – gọi method qua request/response file
//   5. kill – dừng process với fallback SIGKILL
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import path from 'node:path';
import * as fs from 'node:fs/promises';
import { kill } from 'node:process';
import EventEmitter from 'node:events';
import { randomUUID } from 'node:crypto';
import { type ChildProcess, execFile as nodeExecFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import chokidar from 'chokidar';
import extract from 'extract-zip';
import debugFactory from 'debug';

import { EngineTimeoutError, InvalidEngineError, PluginError, RequestTimeoutError } from '../errors';
import { createTimer } from '@src/common/timer';
import { exists, checksum, download, type DownloadProgress } from './download';

// ─── Constants ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const debug = debugFactory('browser-with-fingerprints:connector:engine');

export const CLOSE_TIMEOUT = 60_000;
export const DEFAULT_TIMEOUT = 900_000;
export const KILL_TIMEOUT = 5_000;
export const ARCH = process.arch.includes('32') ? '32' : '64';
export const CWD = path.join(process.cwd(), 'data');

function resolvePackageRoot(startDir: string): string {
  let current = startDir;
  for (;;) {
    try {
      const pkg = require(path.join(current, 'package.json')) as { name: string };
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {}
    const parent = path.dirname(current);
    if (parent === current) {
      throw new PluginError('[RemoteEngine] Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.');
    }
    current = parent;
  }
}
const PACKAGE_ROOT = resolvePackageRoot(__dirname);
export const PROJECT_PATH = path.join(PACKAGE_ROOT, 'project.xml');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EngineOptions {
  cwd?: string;
  args?: string[];
  engineTimeout?: string | number;
  requestTimeout?: string | number;
  execFile?: typeof nodeExecFile;
  closeTimeout?: number;
}
export interface RunFunctionOptions {
  engineTimeout?: number;
  requestTimeout?: number;
}
export interface EngineMeta {
  version: string;
  checksum: string;
  url: string;
}
export interface FunctionResult {
  error?: string;
  response?: unknown;
  [key: string]: unknown;
}

// ─── RemoteEngine ────────────────────────────────────────────────────────────

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

  // ─── Configuration Methods ─────────────────────────────────────────────────

  setCwd(value?: string): void {
    this.#cwd = path.resolve(value || CWD);
  }

  setArgs(value?: string[]): void {
    this.#args = Array.isArray(value) ? value : [];
  }

  setEngineTimeout(value?: string | number): void {
    const timeout = Number(value);
    this.#engineTimeout = timeout > 0 ? timeout : DEFAULT_TIMEOUT;
  }

  get requestTimeout(): number {
    return this.#requestTimeout;
  }

  setRequestTimeout(value?: string | number): void {
    const timeout = Number(value);
    this.#requestTimeout = timeout > 0 ? timeout : DEFAULT_TIMEOUT;
  }

  // ─── Runtime Methods ───────────────────────────────────────────────────────

  async runFunction(
    name: string,
    params: unknown,
    { engineTimeout = this.#engineTimeout, requestTimeout = this.#requestTimeout }: RunFunctionOptions = {}
  ): Promise<FunctionResult> {
    if (!this.#meta) await this.#updateMeta(engineTimeout);
    const engineProcess = await this.#startProcess(engineTimeout);
    debug(`Đang gọi method "${name}" (timeout: ${String(requestTimeout)}ms)`);
    const requestDir = path.join(path.dirname(engineProcess.spawnfile), 'r');
    await fs.mkdir(requestDir, {
      recursive: true,
    });
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
    const requestPath = path.join(requestDir, `${String(engineProcess.pid)}_${randomUUID()}.json`);
    debug(`Tạo file request mới cho hàm "${name}" - ${requestPath}`);
    await fs.writeFile(
      requestPath,
      JSON.stringify({
        name,
        params,
      })
    );
    const requestWatcher = chokidar.watch(requestPath, {
      awaitWriteFinish: true,
    });
    let responseStr: string | undefined;
    try {
      responseStr = await new Promise<string>((resolve, reject) => {
        let requestTimer: ReturnType<typeof createTimer> | undefined;
        let closeTimer: ReturnType<typeof createTimer> | undefined;
        if (requestTimeout) {
          requestTimer = createTimer(requestTimeout);
          void requestTimer.promise.then(() => {
            reject(new RequestTimeoutError(`Hết thời gian chờ khi gọi method "${name}".`));
          });
        }
        const closeHandler = () => {
          closeTimer = createTimer(this.#closeTimeout);
          void closeTimer.promise.then(() => {
            debug('Tiến trình engine đã đóng trong lúc chờ phản hồi');
            resolve('');
          });
        };
        requestWatcher.on('change', () => {
          void fs.readFile(requestPath, 'utf8').then((content) => {
            debug('Đã nhận kết quả từ engine thành công');
            requestTimer?.clear();
            closeTimer?.clear();
            engineProcess.off('close', closeHandler);
            void fs.unlink(requestPath).then(() => {
              resolve(content);
            });
          });
        });
        engineProcess.once('close', closeHandler);
      });
    } finally {
      await requestWatcher.close();
    }
    if (!responseStr)
      return {
        error: 'Engine process closed unexpectedly',
      };
    try {
      return JSON.parse(responseStr) as FunctionResult;
    } catch {
      return {
        error: 'Invalid response format from engine',
      };
    }
  }

  // ─── Process Management ────────────────────────────────────────────────────

  async #startProcessInternal(): Promise<ChildProcess> {
    const cwd = this.#cwd;
    const meta = this.#meta;
    if (!cwd || !meta) throw new PluginError('[RemoteEngine] Chưa được khởi tạo.');
    const scriptDir = path.join(cwd, 'script', meta.version);
    const engineDir = path.join(cwd, 'engine', meta.version);
    const zipPath = path.join(engineDir, `FastExecuteScript.x${ARCH}.zip`);
    const tmpPath = zipPath + '.tmp';
    if (await exists(tmpPath)) {
      await fs.unlink(tmpPath).catch(() => {});
      debug('Đã xoá file .tmp còn sót từ lần tải trước');
    }
    if (meta.checksum && (await exists(zipPath))) {
      if (meta.checksum !== (await checksum(zipPath))) {
        await fs.rm(engineDir, {
          recursive: true,
          force: true,
        });
        debug('Đã xóa engine bị lỗi (sai checksum)');
      }
    }
    if (!(await exists(zipPath))) {
      await fs.mkdir(engineDir, {
        recursive: true,
      });
      const localZip = path.join(PACKAGE_ROOT, 'plugin', `FastExecuteScript.x${ARCH}.zip`);
      if (await exists(localZip)) {
        await fs.copyFile(localZip, zipPath);
        debug('Engine copied from local zip');
      } else {
        this.emit('beforeDownload');
        const onProgress = (p: DownloadProgress) => this.emit('downloadProgress', p);
        await download(meta.url, zipPath, onProgress, this.#engineTimeout);
        debug('Engine tải xuống thành công');
      }
    }
    if (!(await exists(scriptDir))) {
      this.emit('beforeExtract');
      await fs.mkdir(scriptDir, {
        recursive: true,
      });
      await extract(zipPath, {
        dir: scriptDir,
      });
      debug('Engine giải nén thành công');
    }
    await fs.copyFile(PROJECT_PATH, path.join(scriptDir, 'project.xml'));
    await fs.writeFile(path.join(scriptDir, 'worker_command_line.txt'), '--mock-connector');
    await fs.writeFile(path.join(scriptDir, 'settings.ini'), 'RunProfileRemoverImmediately=true');
    debug(`Đang khởi chạy tiến trình engine (cwd: ${scriptDir})`);
    return new Promise<ChildProcess>((resolve, reject) => {
      const proc = this.#execFile(
        path.join(scriptDir, 'FastExecuteScript.exe'),
        ['--silent', ...this.#args],
        {
          cwd: scriptDir,
        },
        (error) => {
          if (error) {
            reject(new InvalidEngineError(`Không thể khởi chạy tiến trình engine (mã lỗi: ${String(error.code)})`));
          }
        }
      );
      this.#process = proc;
      resolve(proc);
    });
  }

  #isProcessAlive(proc?: ChildProcess): boolean {
    if (!proc) return false;
    if (proc.killed) return false;
    try {
      process.kill(proc.pid as number, 0);
      return true;
    } catch {
      return false;
    }
  }

  async kill(timeout = KILL_TIMEOUT): Promise<void> {
    if (!this.#process || this.#process.killed) return;
    const proc = this.#process;
    const exitPromise = new Promise<void>((resolve) => {
      proc.once('exit', resolve);
    });
    if (proc.exitCode !== null) {
      this.#process = undefined;
      return;
    }
    proc.kill();
    const sigkillTimer = createTimer(timeout);
    void sigkillTimer.promise.then(() => {
      proc.kill('SIGKILL');
    });
    await exitPromise;
    sigkillTimer.clear();
    this.#process = undefined;
  }

  async #startProcess(timeout?: number): Promise<ChildProcess> {
    if (this.#isProcessAlive(this.#process)) {
      debug('Tái sử dụng tiến trình engine hiện tại');
      return this.#process as ChildProcess;
    }
    if (!timeout) return await this.#startProcessInternal();
    let timer: NodeJS.Timeout | null = null;
    const engineProcess = await Promise.race<ChildProcess>([
      this.#startProcessInternal(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => { reject(new EngineTimeoutError('Hết thời gian chờ khi khởi tạo engine plugin.')); },
          timeout
        ).unref();
      }),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (timer) clearTimeout(timer);
    return engineProcess;
  }

  async #updateMeta(_timeout: number = DEFAULT_TIMEOUT): Promise<void> {
    const project = await fs.readFile(PROJECT_PATH, 'utf8');
    const versionMatch = project.match(/<EngineVersion>(\d+\.\d+\.\d+)<\/EngineVersion>/);
    if (!versionMatch) throw new InvalidEngineError('Không thể đọc phiên bản Engine từ project.xml');
    const version = versionMatch[1];
    debug(`Cập nhật metadata cho engine (arch: ${ARCH}, version: ${version})`);
    this.#meta = {
      version,
      checksum: '',
      url: `https://github.com/maxlogvn/finger-chromium/releases/download/engine-v${version}/FastExecuteScript.x${ARCH}.zip`,
    };
  }
}
