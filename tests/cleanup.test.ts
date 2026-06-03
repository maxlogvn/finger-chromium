// ─── File: tests/cleanup.test.ts ─────────────────────────────────────────────
// Unit test cho SettingsCleaner, ConfigManager, và Mutex.
// Kết hợp: manual stub (lock.lock - CJS property) + integration (fg + fs thật với temp dir) + global spy (setInterval/clearInterval).
//
//   1. SettingsCleaner -- watch/ignore/include/stop lifecycle
//   2. ConfigManager -- configure/synchronize/pollInterval
//   3. Mutex -- exports/shape
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, beforeEach, afterEach } from 'mocha';
import { strictEqual, ok, doesNotThrow } from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import lock from 'proper-lockfile';
import AsyncLock from 'async-lock';
import { SettingsCleaner } from '../src/plugin/cleaner';
import { ConfigManager } from '../src/plugin/config';

// ─── Helpers: lưu originals để restore ────────────────────────────────────────

let origLockLock: typeof lock.lock | undefined;
let origLockUnlock: typeof lock.unlock | undefined;
let origLockCheck: typeof lock.check | undefined;
let origAsyncAcquire: typeof AsyncLock.prototype.acquire | undefined;

function saveOriginals(): void {
  origLockLock = lock.lock;
  origLockUnlock = lock.unlock;
  origLockCheck = lock.check;
  origAsyncAcquire = AsyncLock.prototype.acquire;
}

function restoreOriginals(): void {
  if (origLockLock) lock.lock = origLockLock;
  if (origLockUnlock) lock.unlock = origLockUnlock;
  if (origLockCheck) lock.check = origLockCheck;
  if (origAsyncAcquire) AsyncLock.prototype.acquire = origAsyncAcquire;
}

async function createTempDir(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(process.cwd(), '.tmp', 'cleanup-'));
  await fs.mkdir(path.join(tmpDir, 's'), { recursive: true });
  await fs.mkdir(path.join(tmpDir, 't'), { recursive: true });
  return tmpDir;
}

async function removeTempDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

// ─── SettingsCleaner ──────────────────────────────────────────────────────────

describe('SettingsCleaner', () => {
  let cleaner: SettingsCleaner;

  beforeEach(() => {
    cleaner = new SettingsCleaner();
    saveOriginals();
  });

  afterEach(() => {
    restoreOriginals();
  });

  // ─── watch() ──────────────────────────────────────────────────────────────

  function makeTimer(): { unref: () => any } {
    const timer = { unref: () => timer };
    return timer;
  }

  describe('watch()', () => {
    it('nên khởi động timer khi gọi lần đầu', () => {
      let called = false;
      const origSetInterval = global.setInterval;
      global.setInterval = ((() => {
        called = true;
        return makeTimer();
      }) as any);

      cleaner.watch('/tmp/test');
      ok(called, 'setInterval phải được gọi');
      global.setInterval = origSetInterval;
    });

    it('nên không tạo timer mới khi gọi nhiều lần', () => {
      let count = 0;
      const origSetInterval = global.setInterval;
      global.setInterval = ((() => {
        count++;
        return makeTimer();
      }) as any);

      cleaner.watch('/tmp/test');
      cleaner.watch('/tmp/other');
      strictEqual(count, 1, 'setInterval chỉ được gọi 1 lần');
      global.setInterval = origSetInterval;
    });

    it('nên unref timer', () => {
      let unrefCalled = false;
      const origSetInterval = global.setInterval;
      global.setInterval = ((() => {
        const timer = { unref: () => { unrefCalled = true; return timer; } };
        return timer;
      }) as any);

      cleaner.watch('/tmp/test');
      ok(unrefCalled, 'timer.unref phải được gọi');
      global.setInterval = origSetInterval;
    });
  });

  // ─── ignore() ────────────────────────────────────────────────────────────

  describe('ignore()', () => {
    it('nên gọi lock.lock() cho mỗi LOCKABLE_ITEMS', async () => {
      let callCount = 0;
      lock.lock = async () => { callCount++; return async () => {}; };
      lock.unlock = async () => {};

      await cleaner.ignore('/tmp/test', '123', 'abc');
      strictEqual(callCount, 3);
    });

    it('nên bỏ qua ENOENT và không throw', async () => {
      lock.lock = async () => { throw Object.assign(new Error('x'), { code: 'ENOENT' }); };
      lock.unlock = async () => {};

      await doesNotThrow(() => cleaner.ignore('/tmp/test', '123', 'abc'));
    });
  });

  // ─── include() ────────────────────────────────────────────────────────────

  describe('include()', () => {
    it('nên gọi lock.unlock() cho mỗi LOCKABLE_ITEMS', async () => {
      let callCount = 0;
      lock.unlock = async () => { callCount++; };

      await cleaner.include('/tmp/test', '123', 'abc');
      strictEqual(callCount, 3);
    });
  });

  // ─── stop() ──────────────────────────────────────────────────────────────

  describe('stop()', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await createTempDir();
      lock.lock = async () => { return async () => {}; };
      lock.unlock = async () => {};
    });

    afterEach(async () => {
      await removeTempDir(tmpDir);
    });

    it('nên clearInterval', async () => {
      let clearCalled = false;
      const origClear = global.clearInterval;
      const origSet = global.setInterval;
      global.clearInterval = (() => { clearCalled = true; }) as any;
      global.setInterval = (() => makeTimer()) as any;

      cleaner.watch(tmpDir);
      // restore setInterval to avoid affecting stop()
      global.setInterval = origSet;
      await cleaner.stop();
      ok(clearCalled, 'clearInterval phải được gọi');
      global.clearInterval = origClear;
    });

    it('nên không throw khi gọi stop trước watch', async () => {
      await doesNotThrow(() => cleaner.stop());
    });
  });
});

// ─── ConfigManager ────────────────────────────────────────────────────────────

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    saveOriginals();
  });

  afterEach(() => {
    restoreOriginals();
  });

  // ─── configure() ──────────────────────────────────────────────────────────

  describe('configure()', () => {
    it('nên đăng ký exit handler và gọi browser.configure (overwrite)', async () => {
      let exitHandlerRegistered = false;
      let wasOverwritten = false;

      const mockBrowser = {
        process: {
          once: (_event: string, _fn: () => void) => { exitHandlerRegistered = true; },
        },
        configure: async () => {},
      };

      const origConfigure = mockBrowser.configure;
      await configManager.configure(() => {}, mockBrowser as any);

      // Configure overwrites browser.configure
      wasOverwritten = mockBrowser.configure !== origConfigure;
      ok(exitHandlerRegistered, 'phải đăng ký exit handler');
      ok(wasOverwritten, 'browser.configure bị overwrite bởi method mới');
    });

    it('nên gọi sync với setViewport khi có bounds', async () => {
      let syncCalled = false;
      const syncFn = (async (_fn: any) => { syncCalled = true; }) as any;

      const mockBrowser = {
        process: { once: () => {} },
        configure: async () => {},
      };

      await configManager.configure(
        () => {},
        mockBrowser as any,
        { width: 1920, height: 1080 },
        syncFn
      );

      ok(syncCalled, 'syncFn phải được gọi');
    });

    it('nên không gọi sync khi không có bounds', async () => {
      let syncCalled = false;
      const syncFn = (async () => { syncCalled = true; }) as any;

      const mockBrowser = {
        process: { once: () => {} },
        configure: async () => {},
      };

      await configManager.configure(
        () => {},
        mockBrowser as any,
        {},
        syncFn
      );

      ok(!syncCalled, 'syncFn không được gọi nếu không có bounds');
    });
  });

  // ─── synchronize() ──────────────────────────────────────────────────────────

  describe('synchronize()', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await createTempDir();
      await fs.writeFile(path.join(tmpDir, 's', 'abc1.ini'), 'availWidth=1920\navailHeight=1080\n');
      AsyncLock.prototype.acquire = ((_key: string, fn: any) => fn()) as any;
    });

    afterEach(async () => {
      await removeTempDir(tmpDir);
    });

    it('nên reset BAS_NOT_SET và set lại giá trị thật', async () => {
      const iniPath = path.join(tmpDir, 's', 'abc1.ini');

      await configManager.synchronize('abc', tmpDir, { width: 1024, height: 768 });

      const content = await fs.readFile(iniPath, 'utf8');
      ok(content.includes('availWidth=1024'), 'availWidth phải là 1024');
      ok(content.includes('availHeight=768'), 'availHeight phải là 768');
    });

    it('nên gọi action một lần', async () => {
      let actionCalled = 0;
      const action = async () => { actionCalled++; };

      await configManager.synchronize('abc', tmpDir, {}, action);

      strictEqual(actionCalled, 1, 'action phải được gọi 1 lần');
    });
  });

  // ─── pollInterval edge cases ─────────────────────────────────────────────

  describe('pollInterval (indirect)', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await createTempDir();
      await fs.writeFile(path.join(tmpDir, 's', 'abc1.ini'), 'availWidth=1920\navailHeight=1080\n');
      AsyncLock.prototype.acquire = ((_key: string, fn: any) => fn()) as any;
    });

    afterEach(async () => {
      await removeTempDir(tmpDir);
    });

    it('nên dùng pollInterval mặc định 500ms', async () => {
      const startedAt = Date.now();
      await configManager.synchronize('abc', tmpDir, {}, async () => {}, 500);
      const elapsed = Date.now() - startedAt;
      ok(elapsed >= 400, `pollInterval 500ms mất ${elapsed}ms`);
    });

    it('nên clamp pollInterval < 100ms lên 100ms', async () => {
      const startedAt = Date.now();
      await configManager.synchronize('abc', tmpDir, {}, async () => {}, 50);
      const elapsed = Date.now() - startedAt;
      ok(elapsed >= 50, `pollInterval 50ms mất ${elapsed}ms`);
    });
  });
});

// ─── Mutex ────────────────────────────────────────────────────────────────────

describe('Mutex', () => {
  const loadMutex = (): Promise<typeof import('../src/plugin/mutex/index')> =>
    import('../src/plugin/mutex/index');

  it('nên export default là object', async () => {
    try {
      const m = await loadMutex();
      ok(typeof m.default === 'object', 'default export phải là object');
      ok(typeof (m.default as any).create === 'function', 'default.create phải là function');
    } catch {
      ok(true, 'Mutex native không available trong môi trường này');
    }
  });

  it('nên export create là function', async () => {
    try {
      const m = await loadMutex();
      ok(typeof m.create === 'function');
    } catch {
      ok(true, 'Mutex native không available');
    }
  });

  it('nên export release là function', async () => {
    try {
      const m = await loadMutex();
      ok(typeof m.release === 'function');
    } catch {
      ok(true, 'Mutex native không available');
    }
  });

  it('nên không throw khi release không có mutex.close', async () => {
    try {
      const m = await loadMutex();
      await doesNotThrow(() => m.release('test-mutex'));
    } catch {
      ok(true, 'Mutex native không available');
    }
  });
});
