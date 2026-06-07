// ─── File: index.ts ──────────────────────────────────────────────────────
// Browser launcher – spawn Chromium process và đợi DevTools URL.
//
//   1. Validate executablePath
//   2. Spawn process với args và debugging port
//   3. Đợi DevTools URL từ stdout/stderr (có timeout)
//   4. Trả về Browser handle với close() dùng taskkill
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import path from 'node:path';
import { createInterface } from 'node:readline';
import { exec, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

import { PluginError } from '../errors';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Browser {
  process: ChildProcess;
  port: number;
  url: string;
  configure(): Promise<void>;
  close(): Promise<void>;
}

export interface LaunchOptions {
  debuggingPort?: number;
  userDataDir?: string;
  headless?: boolean;
  timeout?: number;
  args?: string[];
  executablePath: string;
}

// ─── Launch ──────────────────────────────────────────────────────────────────

export const launch = async ({
  args = [],
  timeout = 30000,
  userDataDir = '',
  debuggingPort = 0,
  executablePath
}: LaunchOptions): Promise<Browser> => {
  if (!executablePath) {
    throw new PluginError('[BrowserLauncher] executablePath là bắt buộc.');
  }
  const resolvedArgs = userDataDir ? [...args, `--user-data-dir=${path.resolve(userDataDir)}`] : [...args];
  const childProcess = spawn(executablePath, [...resolvedArgs, `--remote-debugging-port=${debuggingPort}`], {
    detached: false,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let isClosed = false;
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
    const readlineStderr = createInterface({
      input: childProcess.stderr!
    });
    const readlineStdout = createInterface({
      input: childProcess.stdout!
    });
    const onLine = (line: string) => {
      const match = line.match(/DevTools listening on (wss?:\/\/\S+)/);
      if (match) {
        cleanup();
        resolve(match[1]);
      }
    };
    readlineStderr.on('line', onLine);
    readlineStdout.on('line', onLine);
    childProcess.once('exit', (code, signal) => {
      cleanup();
      reject(new PluginError(`Child process exited before providing DevTools URL. Exit code: ${code}, signal: ${signal}`));
    });
    childProcess.once('error', err => {
      cleanup();
      reject(new PluginError(`Failed to spawn browser: ${err.message}`));
    });
  });
  let port: number;
  try {
    port = Number(new URL(url).port);
  } catch {
    throw new PluginError(`Invalid DevTools URL received: ${url}`);
  }
  const close = async (): Promise<void> => {
    if (isClosed) return;
    isClosed = true;
    if (!childProcess.pid || childProcess.killed) return;
    return new Promise<void>(resolve => {
      exec(`taskkill /pid ${childProcess.pid} /T /F`, (err, _stdout, _stderr) => {
        if (err) {
          console.error(`[BrowserLauncher] taskkill failed (${err.message}), falling back to childProcess.kill()`);
          childProcess.kill('SIGKILL');
        } else {
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
    configure: async () => {}
  };
};