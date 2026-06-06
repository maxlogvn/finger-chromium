import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { PluginError } from '../../src/plugin/errors';
import {
  skipTestIfNoKey,
  createEngine,
  withEngine,
  MOCK_FINGERPRINT_DATA,
  MOCK_FINGERPRINT_OPTIONS,
  MOCK_PROXY_OPTIONS,
  MOCK_PROFILE_OPTIONS,
} from '../helpers';

// ─── Smoke: BrowserEngine ────────────────────────────────────────────────

describe('Smoke: BrowserEngine', function () {
  if (skipTestIfNoKey()) return;
  this.timeout(60000);

  // ─── Minimal Flow ──────────────────────────────────────────────────────

  describe('Minimal Flow', () => {
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

  // ─── Fluent API ────────────────────────────────────────────────────────

  describe('Fluent API', () => {
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

  // ─── Error Handling ────────────────────────────────────────────────────

  describe('Error Handling', () => {
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

  // ─── newFingerprint ────────────────────────────────────────────────────

  describe('newFingerprint', () => {
    it('gọi API trả về JSON string hợp lệ', async () => {
      await withEngine(async (engine) => {
        const fp = await engine.newFingerprint({ tags: ['Chrome', 'Windows 10'] });
        assert.strictEqual(typeof fp, 'string');
        const parsed = JSON.parse(fp);
        assert.ok(parsed !== null && typeof parsed === 'object');
      });
    });
  });
});
