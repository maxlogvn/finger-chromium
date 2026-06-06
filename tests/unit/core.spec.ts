import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from '../../src/plugin/errors';
import {
  BrowserEngine,
} from '../../src/adapter/playwright/fluent';
import {
  getValidPollInterval,
  ConfigManager,
} from '../../src/plugin/config';

import type { Browser } from '../../src/plugin/launcher';

// ─── Error classes ───────────────────────────────────────────────────────────

describe('Error classes', () => {
  describe('PluginError', () => {
    it('tạo instance với empty message', () => {
      const err = new PluginError('');
      assert.ok(err instanceof Error);
      assert.ok(err instanceof PluginError);
      assert.strictEqual(err.name, 'PluginError');
    });

    it('tạo instance với custom message', () => {
      const msg = 'Something went wrong';
      const err = new PluginError(msg);
      assert.strictEqual(err.message, msg);
    });

    it('[Symbol.toStringTag] trả về constructor.name', () => {
      const err = new PluginError('');
      assert.strictEqual(err[Symbol.toStringTag], 'PluginError');
    });
  });

  describe('MissingKeyError', () => {
    it('kế thừa PluginError', () => {
      const err = new MissingKeyError('');
      assert.ok(err instanceof PluginError);
      assert.ok(err instanceof Error);
    });

    it('message chứa hướng dẫn set key', () => {
      const err = new MissingKeyError('Custom message');
      assert.ok(err.message.includes('Custom message'));
      assert.ok(err.message.includes('chỉ định key'));
    });

    it('name là MissingKeyError', () => {
      const err = new MissingKeyError('');
      assert.strictEqual(err.name, 'MissingKeyError');
    });
  });

  describe('InvalidEngineError', () => {
    it('kế thừa PluginError', () => {
      const err = new InvalidEngineError('');
      assert.ok(err instanceof PluginError);
    });

    it('message chứa hướng dẫn khắc phục', () => {
      const err = new InvalidEngineError('Engine lỗi');
      assert.ok(err.message.includes('Engine lỗi'));
      assert.ok(err.message.includes('Xóa hoàn toàn thư mục engine'));
    });
  });

  describe('EngineTimeoutError', () => {
    it('kế thừa PluginError', () => {
      const err = new EngineTimeoutError('');
      assert.ok(err instanceof PluginError);
    });

    it('message chứa hướng dẫn setEngineTimeout', () => {
      const err = new EngineTimeoutError('Timeout');
      assert.ok(err.message.includes('Timeout'));
      assert.ok(err.message.includes('setEngineTimeout'));
    });
  });

  describe('RequestTimeoutError', () => {
    it('kế thừa PluginError', () => {
      const err = new RequestTimeoutError('');
      assert.ok(err instanceof PluginError);
    });

    it('message chứa hướng dẫn setRequestTimeout', () => {
      const err = new RequestTimeoutError('Request timeout');
      assert.ok(err.message.includes('Request timeout'));
      assert.ok(err.message.includes('setRequestTimeout'));
    });
  });
});

// ─── Public exports ──────────────────────────────────────────────────────────

describe('Public exports', () => {
  it('PluginError là class (function)', () => {
    assert.strictEqual(typeof PluginError, 'function');
  });

  it('MissingKeyError là subclass của PluginError', () => {
    const err = new MissingKeyError('');
    assert.ok(err instanceof PluginError);
  });

  it('InvalidEngineError là subclass của PluginError', () => {
    const err = new InvalidEngineError('');
    assert.ok(err instanceof PluginError);
  });

  it('EngineTimeoutError là subclass của PluginError', () => {
    const err = new EngineTimeoutError('');
    assert.ok(err instanceof PluginError);
  });

  it('RequestTimeoutError là subclass của PluginError', () => {
    const err = new RequestTimeoutError('');
    assert.ok(err instanceof PluginError);
  });

  it('BrowserEngine là class (function)', () => {
    assert.strictEqual(typeof BrowserEngine, 'function');
  });
});

// ─── Config ──────────────────────────────────────────────────────────────────

describe('Config', () => {
  describe('getValidPollInterval()', () => {
    it('undefined trả về DEFAULT_POLL_INTERVAL (500)', () => {
      assert.strictEqual(getValidPollInterval(undefined), 500);
    });

    it('NaN trả về DEFAULT_POLL_INTERVAL', () => {
      assert.strictEqual(getValidPollInterval(NaN), 500);
    });

    it('âm trả về DEFAULT_POLL_INTERVAL', () => {
      assert.strictEqual(getValidPollInterval(-1), 500);
      assert.strictEqual(getValidPollInterval(-100), 500);
    });

    it('giá trị < 100 clamp về 100', () => {
      assert.strictEqual(getValidPollInterval(0), 100);
      assert.strictEqual(getValidPollInterval(50), 100);
      assert.strictEqual(getValidPollInterval(99), 100);
    });

    it('giá trị >= 100 giữ nguyên', () => {
      assert.strictEqual(getValidPollInterval(100), 100);
      assert.strictEqual(getValidPollInterval(200), 200);
      assert.strictEqual(getValidPollInterval(1000), 1000);
    });
  });

  describe('ConfigManager.configure()', () => {
    let configManager: ConfigManager;

    beforeEach(() => {
      configManager = new ConfigManager();
    });

    it('đăng ký cleanup handler qua process.once("exit")', async () => {
      let cleanupCalled = false;
      const mockProcess = { once: (_event: string, handler: () => void) => { handler(); cleanupCalled = true; } };
      const mockBrowser = {
        process: mockProcess,
        port: 0,
        url: '',
        configure: async () => {},
        close: async () => {},
      } as unknown as Browser;

      await configManager.configure(
        () => {},
        mockBrowser,
      );

      assert.ok(cleanupCalled);
    });

    it('gán browser.configure và gọi nó', async () => {
      const mockProcess = { once: () => {} };
      const originalConfigure = async () => {};
      const mockBrowser = {
        process: mockProcess,
        port: 0,
        url: '',
        configure: originalConfigure,
        close: async () => {},
      } as unknown as Browser;

      await configManager.configure(
        () => {},
        mockBrowser,
      );

      assert.notStrictEqual(mockBrowser.configure, originalConfigure);
    });

    it('gọi sync với setViewport khi có width/height', async () => {
      const mockProcess = { once: () => {} };
      const mockBrowser = {
        process: mockProcess,
        port: 0,
        url: '',
        configure: async () => {},
        close: async () => {},
      } as unknown as Browser;

      let syncCalled = false;
      const syncWrapper = async <T>(_fn: () => Promise<T> | T): Promise<T> => {
        syncCalled = true;
        return undefined as T;
      };

      await configManager.configure(
        () => {},
        mockBrowser,
        { width: 1920, height: 1080 },
        syncWrapper,
      );

      assert.ok(syncCalled);
    });

    it('không gọi sync khi thiếu width/height', async () => {
      const mockProcess = { once: () => {} };
      const mockBrowser = {
        process: mockProcess,
        port: 0,
        url: '',
        configure: async () => {},
        close: async () => {},
      } as unknown as Browser;

      let syncCalled = false;
      const syncWrapper = async <T>(fn: () => Promise<T> | T): Promise<T> => {
        syncCalled = true;
        return fn();
      };

      await configManager.configure(
        () => {},
        mockBrowser,
        {},
        syncWrapper,
      );

      assert.ok(!syncCalled);
    });
  });

  describe('ConfigManager.synchronize()', () => {
    let configManager: ConfigManager;
    let tmpDir: string;

    beforeEach(() => {
      configManager = new ConfigManager();
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finger-test-'));
      fs.mkdirSync(path.join(tmpDir, 's'), { recursive: true });
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('reset availWidth/availHeight về BAS_NOT_SET sau đó set giá trị thật', async () => {
      const id = 'test1';
      const iniPath = path.join(tmpDir, 's', `${id}1.ini`);
      fs.writeFileSync(iniPath, 'availWidth=1024\navailHeight=768\n', 'utf8');

      await configManager.synchronize(
        id,
        tmpDir,
        { width: 1920, height: 1080 },
        async () => {},
        100,
      );

      const content = fs.readFileSync(iniPath, 'utf8');
      assert.ok(content.includes('availWidth=1920'));
      assert.ok(content.includes('availHeight=1080'));
      assert.ok(!content.includes('availWidth=1024'));
      assert.ok(!content.includes('availHeight=768'));
    });

    it('giữ nguyên BAS_NOT_SET khi bounds không có giá trị', async () => {
      const id = 'test2';
      const iniPath = path.join(tmpDir, 's', `${id}1.ini`);
      fs.writeFileSync(iniPath, 'availWidth=1024\navailHeight=768\n', 'utf8');

      await configManager.synchronize(
        id,
        tmpDir,
        {},
        async () => {},
        100,
      );

      const content = fs.readFileSync(iniPath, 'utf8');
      assert.ok(content.includes('availWidth=BAS_NOT_SET'));
      assert.ok(content.includes('availHeight=BAS_NOT_SET'));
    });

    it('throw lỗi khi file .ini không tồn tại', async () => {
      await assert.rejects(
        () => configManager.synchronize('nonexistent-id', tmpDir, {}, async () => {}, 100),
      );
    });
  });
});
