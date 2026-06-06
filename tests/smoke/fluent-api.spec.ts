import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  withEngine,
  MOCK_FINGERPRINT_DATA,
  MOCK_FINGERPRINT_OPTIONS,
  MOCK_PROXY_OPTIONS,
  MOCK_PROFILE_OPTIONS,
} from '../helpers';

describe('Smoke: Fluent API', function () {
  this.timeout(60000);

  it('useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finger-test-'));
    try {
      await withEngine(async (engine) => {
        engine
          .useFingerprint(MOCK_FINGERPRINT_DATA, MOCK_FINGERPRINT_OPTIONS)
          .useProxy('http://localhost:8080', MOCK_PROXY_OPTIONS)
          .useProfile(tmpDir, MOCK_PROFILE_OPTIONS)
          .launch();

        const ctx = await engine.newContext();
        assert.ok(ctx);
        assert.strictEqual(typeof ctx.close, 'function');
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
