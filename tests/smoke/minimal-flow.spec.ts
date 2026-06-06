import assert from 'node:assert';

import { withEngine } from '../helpers';

describe('Smoke: Minimal Flow', function () {
  this.timeout(60000);

  it('launch -> newContext -> quit', async () => {
    await withEngine(async (engine) => {
      engine.launch();
      const ctx = await engine.newContext();
      assert.ok(ctx);
      assert.strictEqual(typeof ctx.newPage, 'function');
    });
  });

  it('withEngine wrapper cleanup', async () => {
    await withEngine(async (engine) => {
      engine.launch();
      const ctx = await engine.newContext();
      assert.ok(ctx);
    });
  });
});
