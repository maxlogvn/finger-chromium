import assert from 'node:assert';

import { BrowserEngine } from '../../src/adapter/playwright/fluent';
import { MockConnector, createMockLauncher } from './helpers';

describe('Integration: Core Flow', function () {
  it('launch -> newContext -> quit with mock connector', async () => {
    const engine = new BrowserEngine(createMockLauncher(), new MockConnector() as any);

    engine.launch();

    const ctx = await engine.newContext();
    assert.ok(ctx, 'context should be returned');
    assert.strictEqual(typeof ctx.close, 'function', 'context should have close method');

    await engine.quit();
  });

  it('quit khi chua launch không throw', async () => {
    const engine = new BrowserEngine();

    let thrown = false;
    try {
      await engine.quit();
    } catch {
      thrown = true;
    }

    assert.strictEqual(thrown, false, 'quit should not throw when not launched');
  });
});
