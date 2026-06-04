// ─── File: launcher/index.ts ───────────────────────────────────────────────
// Browser Launcher -- spawn Chromium child process, phát hiện DevTools URL.
//
//   1. Spawn worker.exe với arguments
//   2. Parse DevTools listening URL từ stderr/stdout
//   3. Trả về Browser object với close/configure
// ─────────────────────────────────────────────────────────────────────────────

import path from 'path';
import { createInterface } from 'readline';
import type { ChildProcess } from 'child_process';
import { exec, spawn } from 'child_process';
import { PluginError } from '../errors';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  executablePath?: string;
}

// ─── Runtime ──────────────────────────────────────────────────────────────────

/**
 * Spawn Chromium và chờ DevTools listening URL.
 * Parse port từ URL, trả về Browser object với close/configure methods.
 */
export const launch = async ({
  args = [],
  timeout = 30000,
  userDataDir = '',
  debuggingPort = 0,
  executablePath = '',
}: LaunchOptions = {}): Promise<Browser> => {
  const resolvedArgs = userDataDir ? [...args, `--user-data-dir=${path.resolve(userDataDir)}`] : [...args];
  const childProcess = spawn(executablePath, [...resolvedArgs, `--remote-debugging-port=${debuggingPort}`], {
    detached: false,
    shell: false,
  });

  // --- Bước 1: Parse DevTools listening URL từ stderr/stdout
  const url = await new Promise<string>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeout) {
      timeoutId = setTimeout(onTimeout, timeout);
    }
    createInterface({ input: childProcess.stderr! }).on('line', onLine);
    createInterface({ input: childProcess.stdout! }).on('line', onLine);
    function onLine(line: string): void {
      const match = line.match(/DevTools listening on (.*)/);
      if (match) {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(match[1]);
      }
    }
    function onTimeout(): void {
      reject(new PluginError(`Timed out after ${timeout}ms while trying to launch the browser.`));
    }
  });

  // --- Bước 2: Parse port từ URL
  const port = Number(new URL(url).port);

  // --- Bước 3: Tạo close method -- dùng taskkill /T /F để kill cả process tree
  const close = async (): Promise<void> => {
    if (childProcess.pid && !childProcess.killed) {
      return new Promise<void>((resolve) => {
        exec(`taskkill /pid ${childProcess.pid} /T /F`, (err) => {
          if (err) {
            childProcess.kill();
          }
          // @ts-expect-error: ChildProcess.killed là read-only, cần set runtime để tránh gọi lại taskkill
          childProcess.killed = true;
          resolve();
        });
      });
    }
  };

  return {
    url,
    port,
    close,
    process: childProcess,
    configure: async () => {},
  };
};
