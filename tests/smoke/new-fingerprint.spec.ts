import assert from 'node:assert';

import { skipTestIfNoKey, withEngine } from '../helpers';

describe('Smoke: newFingerprint', function () {
  if (skipTestIfNoKey()) return;
  this.timeout(60000);

  it('gọi API trả về JSON string hợp lệ', async () => {
    await withEngine(async (engine) => {
      const fp = await engine.newFingerprint({ tags: ['Chrome', 'Windows 10'] });
      assert.strictEqual(typeof fp, 'string');
      const parsed = JSON.parse(fp);
      assert.ok(parsed !== null && typeof parsed === 'object');
    });
  });
});
