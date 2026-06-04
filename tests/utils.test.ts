// ─── File: tests/utils.test.ts ─────────────────────────────────────────────
// Unit test cho error classes, utils, common scripts, và loader module.
//
//   1. Error classes — PluginError, MissingKeyError, InvalidEngineError,
//      EngineTimeoutError, RequestTimeoutError
//   2. Utils — defaultArgs(), getProfilePath(), validateConfig(), validateLauncher()
//   3. Common scripts — waitForResize, getViewport
//   4. Loader — constructor, import(), load()
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'mocha';
import { strictEqual, ok, rejects, throws, doesNotThrow } from 'node:assert';

import {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from '../src/plugin/errors';
import {
  defaultArgs,
  getProfilePath,
  validateConfig,
  validateLauncher,
} from '../src/plugin/utils';
import { scripts } from '../src/common/index';
import Loader from '../src/loader/index';

// ─── Error classes ────────────────────────────────────────────────────────────

describe('Error classes', () => {
  // ─── PluginError ──────────────────────────────────────────────────────────

  describe('PluginError', () => {
    it('nên là instanceof Error và PluginError', () => {
      const err = new PluginError('test');
      ok(err instanceof Error, 'phải là instanceof Error');
      ok(err instanceof PluginError, 'phải là instanceof PluginError');
    });

    it('nên có name bằng constructor name', () => {
      const err = new PluginError('test');
      strictEqual(err.name, 'PluginError');
      strictEqual(err.constructor.name, 'PluginError');
    });

    it('Symbol.toStringTag nên trả về constructor name', () => {
      const err = new PluginError('test');
      strictEqual(
        Object.prototype.toString.call(err),
        '[object PluginError]'
      );
    });

    it('nên lưu đúng message được truyền vào', () => {
      const msg = 'Lỗi plugin test';
      const err = new PluginError(msg);
      strictEqual(err.message, msg);
    });

    it('nên không throw khi khởi tạo', () => {
      ok(() => new PluginError('test'));
    });
  });

  // ─── MissingKeyError ─────────────────────────────────────────────────────

  describe('MissingKeyError', () => {
    it('nên là instanceof PluginError', () => {
      const err = new MissingKeyError('test');
      ok(err instanceof PluginError);
    });

    it('nên có message chứa hướng dẫn set key', () => {
      const err = new MissingKeyError('Thiếu key');
      ok(err.message.includes('bạn cần chỉ định key'));
    });

    it('nên giữ message gốc ở đầu chuỗi', () => {
      const err = new MissingKeyError('Thiếu key');
      ok(err.message.startsWith('Thiếu key'));
    });
  });

  // ─── InvalidEngineError ──────────────────────────────────────────────────

  describe('InvalidEngineError', () => {
    it('nên là instanceof PluginError', () => {
      const err = new InvalidEngineError('test');
      ok(err instanceof PluginError);
    });

    it('nên có message chứa hướng dẫn xoá engine', () => {
      const err = new InvalidEngineError('Engine lỗi');
      ok(err.message.includes('Xóa hoàn toàn thư mục'));
    });
  });

  // ─── EngineTimeoutError ──────────────────────────────────────────────────

  describe('EngineTimeoutError', () => {
    it('nên là instanceof PluginError', () => {
      const err = new EngineTimeoutError('test');
      ok(err instanceof PluginError);
    });

    it('nên có message chứa hướng dẫn setEngineTimeout', () => {
      const err = new EngineTimeoutError('Timeout');
      ok(err.message.includes('setEngineTimeout'));
    });
  });

  // ─── RequestTimeoutError ─────────────────────────────────────────────────

  describe('RequestTimeoutError', () => {
    it('nên là instanceof PluginError', () => {
      const err = new RequestTimeoutError('test');
      ok(err instanceof PluginError);
    });

    it('nên có message chứa hướng dẫn setRequestTimeout', () => {
      const err = new RequestTimeoutError('Timeout request');
      ok(err.message.includes('setRequestTimeout'));
    });
  });
});

// ─── Utils ────────────────────────────────────────────────────────────────────

describe('Utils', () => {
  // ─── defaultArgs() ───────────────────────────────────────────────────────

  describe('defaultArgs()', () => {
    it('nên trả về --user-data-dir với default options', () => {
      const args = defaultArgs();
      ok(args.some((a) => a.startsWith('--user-data-dir')));
    });

    it('nên có --hide-scrollbars và --mute-audio khi headless (default)', () => {
      const args = defaultArgs();
      ok(args.includes('--hide-scrollbars'));
      ok(args.includes('--mute-audio'));
      ok(!args.includes('--bas-force-visible-window'));
    });

    it('nên có --bas-force-visible-window khi devtools: true (non-headless)', () => {
      const args = defaultArgs({ devtools: true });
      ok(args.includes('--bas-force-visible-window'));
      ok(!args.includes('--hide-scrollbars'));
      ok(!args.includes('--mute-audio'));
    });

    it('nên thêm --load-extension khi có extensions', () => {
      const args = defaultArgs({ extensions: ['ext1', 'ext2'] });
      ok(args.some((a) => a.startsWith('--load-extension=')));
      ok(args.some((a) => a.includes('ext1') && a.includes('ext2')));
    });

    it('nên lọc bỏ IGNORED_ARGS (--kiosk, --headless, --user-data-dir, --start-maximized, --start-fullscreen)', () => {
      const args = defaultArgs({
        args: [
          '--kiosk',
          '--headless',
          '--user-data-dir=/tmp/test',
          '--start-maximized',
          '--start-fullscreen',
          '--keep-alive',
        ],
      });
      ok(!args.includes('--kiosk'));
      ok(!args.includes('--headless'));
      ok(!args.includes('--start-maximized'));
      ok(!args.includes('--start-fullscreen'));
      ok(args.includes('--keep-alive'));
    });

    it('nên xử lý --disable-extensions-except và --load-extension kết hợp extensions', () => {
      const args = defaultArgs({
        args: ['--disable-extensions-except=ext_a'],
        extensions: ['ext_b'],
      });
      ok(args.some((a) => a.startsWith('--load-extension=')));
      ok(args.some((a) => a.includes('ext_b')));
    });
  });

  // ─── getProfilePath() ────────────────────────────────────────────────────

  describe('getProfilePath()', () => {
    it('nên ưu tiên userDataDir hơn --user-data-dir trong args', () => {
      const result = getProfilePath({
        userDataDir: '/my/profile',
        args: ['--user-data-dir=/other/profile'],
      });
      ok(result.endsWith('my\\profile') || result.endsWith('my/profile'));
    });

    it('nên fallback sang --user-data-dir trong args khi không có userDataDir', () => {
      const result = getProfilePath({
        args: ['--user-data-dir=C:\\profiles\\test'],
      });
      ok(result === 'C:\\profiles\\test');
    });

    it('nên trả về rỗng khi không có profile path nào', () => {
      const result = getProfilePath();
      strictEqual(result, '');
    });

    it('nên trả về rỗng khi args không có --user-data-dir', () => {
      const result = getProfilePath({ args: ['--no-sandbox'] });
      strictEqual(result, '');
    });
  });

  // ─── validateConfig() ────────────────────────────────────────────────────

  describe('validateConfig()', () => {
    it('nên không throw với value string và options object', () => {
      doesNotThrow(() => validateConfig('fingerprint', 'data', { key: 'val' }));
    });

    it('nên throw PluginError khi value không phải string', () => {
      throws(
        () => validateConfig('fp', null, {}),
        PluginError
      );
    });

    it('nên throw PluginError khi options là null', () => {
      throws(
        () => validateConfig('fp', 'data', null),
        PluginError
      );
    });
  });

  // ─── validateLauncher() ──────────────────────────────────────────────────

  describe('validateLauncher()', () => {
    it('nên không throw với launcher hợp lệ (có launch function)', () => {
      doesNotThrow(() => validateLauncher({ launch: () => {} }));
    });

    it('nên throw PluginError khi launcher là null', () => {
      throws(() => validateLauncher(null), PluginError);
    });

    it('nên throw PluginError khi launcher là undefined', () => {
      throws(() => validateLauncher(undefined), PluginError);
    });

    it('nên throw PluginError khi launcher không phải object', () => {
      throws(() => validateLauncher('not-an-object'), PluginError);
    });

    it('nên throw PluginError khi launcher thiếu method launch', () => {
      throws(() => validateLauncher({}), PluginError);
    });
  });
});

// ─── Common scripts ───────────────────────────────────────────────────────────

describe('Common scripts', () => {
  describe('scripts.waitForResize', () => {
    it('nên là function', () => {
      ok(typeof scripts.waitForResize === 'function');
    });
  });

  describe('scripts.getViewport', () => {
    it('nên là function', () => {
      ok(typeof scripts.getViewport === 'function');
    });
  });
});

// ─── Loader ───────────────────────────────────────────────────────────────────

describe('Loader', () => {
  describe('constructor', () => {
    it('nên lưu target, version, packages', () => {
      const loader = new Loader('playwright-core', '1.27.0', ['fallback-pkg']) as unknown as { target: string; version: string; packages: string[] };
      strictEqual(loader.target, 'playwright-core');
      strictEqual(loader.version, '1.27.0');
      strictEqual(loader.packages[0], 'fallback-pkg');
    });
  });

  describe('import()', () => {
    it('nên trả về undefined khi packages rỗng', () => {
      const result = Loader.import([]);
      strictEqual(result, undefined);
    });

    it('nên throw PluginError khi không tìm thấy package nào', () => {
      throws(
        () => Loader.import(['nonexistent-pkg-xyz-123']),
        PluginError
      );
    });
  });

  describe('load()', () => {
    it('nên throw PluginError khi version không đạt minimum', () => {
      const loader = new Loader('nonexistent-pkg-xyz-123', '999.0.0', []);
      rejects(
        () => loader.load(),
        PluginError
      );
    });
  });
});
