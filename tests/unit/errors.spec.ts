import assert from 'node:assert';

import {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from '../../src/plugin/errors';

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
