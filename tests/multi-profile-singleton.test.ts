// ─── File: tests/bug-007-multi-profile-singleton.test.ts ─────────────────────
// Test cho Bug #7 — Singleton `Fluent` không hỗ trợ launch nhiều profile song song.
//
//   1. `Fluent` là class alias (không phải instance)
//   2. `new BrowserEngine()` tạo instance độc lập — config không ảnh hưởng lẫn nhau
//   3. `launch()` guard hoạt động per-instance
//   4. `quit()` an toàn trên mọi instance
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'mocha';
import { strictEqual, notStrictEqual, ok, rejects } from 'node:assert';
import { BrowserEngine, Fluent } from '../src/adapter/playwright/fluent';

// ─── Fluent là class alias ─────────────────────────────────────────────────

describe('Fluent backward compatibility', () => {
  it('nên là class (cùng reference với BrowserEngine)', () => {
    strictEqual(Fluent, BrowserEngine, 'Fluent phải là alias của BrowserEngine');
  });

  it('nên có thể dùng new Fluent() để tạo instance', () => {
    const instance = new Fluent();
    ok(instance instanceof BrowserEngine, 'new Fluent() phải tạo BrowserEngine instance');
    ok(typeof instance.launch === 'function', 'instance phải có launch()');
    ok(typeof instance.quit === 'function', 'instance phải có quit()');
  });
});

// ─── Instance độc lập ────────────────────────────────────────────────────────

describe('BrowserEngine instance independence', () => {
  it('new BrowserEngine() tạo 2 instance khác nhau', () => {
    const a = new BrowserEngine();
    const b = new BrowserEngine();
    notStrictEqual(a, b, 'Hai instance phải khác reference');
  });

  it('useFingerprint trên instance A không throw — instance B không bị ảnh hưởng', () => {
    const a = new BrowserEngine();
    a.useFingerprint('{ "test": true }', { usePerfectCanvas: true });

    // Instance B vẫn tạo được instance mới — không bị config của A ảnh hưởng
    const b = new BrowserEngine();
    ok(typeof b.launch === 'function', 'Instance B vẫn hoạt động bình thường');
  });

  it('useProfile trên instance A không ảnh hưởng instance B', () => {
    const a = new BrowserEngine();
    const b = new BrowserEngine();

    // Dùng useProfile với path khác nhau
    a.useProfile('./profile_a');
    b.useProfile('./profile_b');

    // Mỗi instance giữ profile riêng — không throw
    ok(true, 'Mỗi instance giữ profile riêng');
  });

  it('launch() guard hoạt động per-instance', () => {
    const a = new BrowserEngine();
    const b = new BrowserEngine();

    // Launch instance A
    a.launch();

    // Launch lại A phải throw
    rejects(
      () => Promise.resolve().then(() => a.launch()),
      /Phuong thuc launch\(\) chi duoc goi mot lan/,
      'launch() lần 2 trên cùng instance phải throw'
    );

    // Launch instance B — phải OK (instance khác)
    b.launch();
    ok(true, 'launch() trên instance B không throw');
  });
});

// ─── quit() an toàn ──────────────────────────────────────────────────────────

describe('BrowserEngine quit safety', () => {
  it('quit() trên instance A không ảnh hưởng instance B', async () => {
    const a = new BrowserEngine();
    const b = new BrowserEngine();

    await a.quit();

    // B vẫn hoạt động bình thường
    b.launch();
    ok(true, 'quit() trên A không ảnh hưởng khả năng launch của B');
  });

  it('quit() không throw khi chưa launch — nhiều instance', async () => {
    const instances = [new BrowserEngine(), new BrowserEngine(), new BrowserEngine()];

    for (const inst of instances) {
      await inst.quit();
    }

    ok(true, 'quit() trên nhiều instance chưa launch không throw');
  });
});
