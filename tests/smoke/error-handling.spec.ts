import assert from 'node:assert';

import { PluginError } from '../../src/plugin/errors';
import { skipTestIfNoKey, createEngine } from '../helpers';

describe('Smoke: Error Handling', function () {
  if (skipTestIfNoKey()) return;
  this.timeout(60000);

  it('newContext trước launch throw PluginError', async () => {
    const engine = createEngine();
    try {
      await assert.rejects(
        () => engine.newContext(),
        PluginError
      );
    } finally {
      await engine.quit();
    }
  });

  it('launch hai lần throw PluginError', async () => {
    const engine = createEngine();
    try {
      engine.launch();
      assert.throws(
        () => engine.launch(),
        PluginError
      );
    } finally {
      await engine.quit();
    }
  });

  it('newContext khi context đã tồn tại throw PluginError', async () => {
    const engine = createEngine();
    try {
      engine.launch();
      const ctx = await engine.newContext();
      assert.ok(ctx);
      await assert.rejects(
        () => engine.newContext(),
        PluginError
      );
    } finally {
      await engine.quit();
    }
  });

  it('quit khi chưa launch không throw', async () => {
    const engine = createEngine();
    await engine.quit();
    assert.ok(true);
  });
});
