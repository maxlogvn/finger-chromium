import assert from 'node:assert';

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
