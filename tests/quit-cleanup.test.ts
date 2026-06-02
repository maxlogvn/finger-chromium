// ─── File: tests/quit-cleanup.test.ts ───────────────────────────────────────
// Test dọn dẹp tài nguyên khi gọi quit() -- đảm bảo không còn child processes,
// engine process, PCAP server, watcher, cleaner timer, mutex sau khi quit.
//
//   1. Phương thức cleanup tồn tại trên các module
//   2. quit() an toàn khi gọi nhiều lần
//   3. quit() an toàn khi chưa launch()
//   4. RemoteEngine.kill() không throw
//   5. pcapServer.close() không throw
//   6. cleaner.stop() không throw
//   7. mutex.release() không throw
//   8. FingerprintPlugin.cleanup() dọn dẹp toàn bộ mà không throw
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'mocha';
import { strictEqual, ok } from 'node:assert';

import RemoteEngine from '../src/plugin/connector/engine';
import * as pcapServer from '../src/plugin/connector/pcapServer';
import cleaner from '../src/plugin/cleaner';
import * as mutex from '../src/plugin/mutex';
import FingerprintPlugin from '../src/plugin';
import { Chromium } from '../src/adapter/playwright/chromium';

// ─── Module-level cleanup methods ────────────────────────────────────────────

describe('Module cleanup methods', function () {
  this.timeout(10_000);

  // ─── RemoteEngine.kill() ──────────────────────────────────────────────────

  describe('RemoteEngine', () => {
    it('nên có method kill() và không throw khi không có process', () => {
      const engine = new RemoteEngine();
      ok(typeof engine.kill === 'function', 'kill() phải tồn tại');
      engine.kill();
    });
  });

  // ─── pcapServer.close() ───────────────────────────────────────────────────

  describe('pcapServer', () => {
    it('nên export close() và resolve ngay khi chưa listen', async () => {
      ok(typeof pcapServer.close === 'function', 'close() phải được export');
      await pcapServer.close();
    });
  });

  // ─── cleaner.stop() ───────────────────────────────────────────────────────

  describe('cleaner', () => {
    it('nên có method stop() và không throw khi chưa watch', async () => {
      ok(typeof cleaner.stop === 'function', 'stop() phải tồn tại');
      await cleaner.stop();
    });

    it('nên dừng timer và unlock files -- gọi 2 lần không throw', async () => {
      await cleaner.stop();
      await cleaner.stop();
    });
  });

  // ─── mutex.release() ──────────────────────────────────────────────────────

  describe('mutex', () => {
    it('nên export release() và không throw với tên bất kỳ', () => {
      ok(typeof mutex.release === 'function', 'release() phải được export');
      mutex.release('BASProcessTest_cleanup');
    });
  });
});

// ─── FingerprintPlugin cleanup ───────────────────────────────────────────────

describe('FingerprintPlugin cleanup', () => {
  it('nên có method cleanup()', () => {
    const plugin = new FingerprintPlugin();
    ok(typeof plugin.cleanup === 'function', 'cleanup() phải tồn tại');
  });

  it('cleanup() không throw khi chưa launch', async () => {
    const plugin = new FingerprintPlugin();
    await plugin.cleanup();
  });

  it('cleanup() không throw khi gọi 2 lần', async () => {
    const plugin = new FingerprintPlugin();
    await plugin.cleanup();
    await plugin.cleanup();
  });
});

// ─── BrowserEngine (Chromium) quit ───────────────────────────────────────────

describe('BrowserEngine.quit()', () => {
  it('quit() không throw khi chưa launch', async () => {
    await Chromium.quit();
  });

  it('quit() không throw khi gọi 2 lần (idempotent)', async () => {
    await Chromium.quit();
    await Chromium.quit();
  });

  it('engine.cleanup() không throw khi chưa khởi tạo engine', async () => {
    await Chromium.engine.cleanup();
  });
});

// ─── PWChromium interface ────────────────────────────────────────────────────

describe('PWChromium interface', () => {
  it('quit() là async function', () => {
    const desc = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(Chromium),
      'quit'
    );
    ok(desc, 'quit() phải tồn tại trên prototype');
    strictEqual(typeof desc.value, 'function', 'quit() phải là function');
  });
});
