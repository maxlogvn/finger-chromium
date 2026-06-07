// ─── File: tests/e2e/fingerprint.spec.ts ─────────────────────────────────
// Kiểm tra tạo fingerprint và khởi động trình duyệt với fingerprint.
//
//   1. Fingerprint cơ bản (không cần key) -- luôn chạy
//   2. Fingerprint cao cấp (cần key) -- skip nếu thiếu BABLOSOFT_KEY
// ─────────────────────────────────────────────────────────────────────────

import { test, expect } from '../fixtures';
import { chromium as BrowserEngine } from '../../src';

const HAS_KEY = !!process.env.BABLOSOFT_KEY;

// ─── Fingerprint cơ bản (không cần key) ──────────────────────────────────

test.describe('Fingerprint co ban', () => {
  test('newFingerprint() tra ve string hop le', async () => {
    const result = await BrowserEngine.newFingerprint();
    expect(result).toEqual(expect.any(String));
    expect(result.length).toBeGreaterThan(0);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  test('khoi dong browser voi fingerprint co ban', async ({ launchContext }) => {
    const fingerprint = await BrowserEngine.newFingerprint();

    const { page } = await launchContext({
      fingerprint: { data: fingerprint },
      launchOptions: { headless: true },
    });

    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });
});

// ─── Fingerprint cao cấp (cần key) ───────────────────────────────────────

test.describe('Fingerprint cao cap', () => {
  test.skip(!HAS_KEY, 'Thieu BABLOSOFT_KEY trong environment');

  test('newFingerprint() voi tags va kich thuoc man hinh tra ve string hop le', async () => {
    const result = await BrowserEngine.newFingerprint({
      tags: ['Desktop', 'Chrome'],
      minWidth: 1920,
      maxHeight: 1080,
    });
    expect(result).toEqual(expect.any(String));
    expect(result.length).toBeGreaterThan(0);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  test('newFingerprint() voi perfectCanvas option tra ve string hop le', async () => {
    const result = await BrowserEngine.newFingerprint({
      perfectCanvasRequest: 'true',
      dynamicPerfectCanvas: true,
    });
    expect(result).toEqual(expect.any(String));
    expect(result.length).toBeGreaterThan(0);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  test('newFingerprint() voi enablePrecomputedFingerprints tra ve string hop le', async () => {
    const result = await BrowserEngine.newFingerprint({
      enablePrecomputedFingerprints: true,
    });
    expect(result).toEqual(expect.any(String));
    expect(result.length).toBeGreaterThan(0);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  test('khoi dong browser voi fingerprint tags va kich thuoc', async ({ launchContext }) => {
    const fingerprint = await BrowserEngine.newFingerprint({
      tags: ['Desktop'],
      minWidth: 1366,
      minHeight: 768,
    });

    const { page } = await launchContext({
      fingerprint: { data: fingerprint },
      launchOptions: { headless: true },
    });

    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });
});
