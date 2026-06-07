// ─── File: tests/e2e/launch.spec.ts ──────────────────────────────────────────
// Kiểm tra BrowserEngine khởi động thành công với cấu hình mặc định.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '../fixtures';

test.describe('Launch mặc định', () => {
  test('page sẵn sàng sau khi launch', async ({ page }) => {
    await page.goto('about:blank');
    await expect(page).toHaveURL('about:blank');
  });

  test('page có thể navigate đến URL thực', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveURL('https://example.com/');
    await expect(page).toHaveTitle(/Example Domain/);
  });

  test('page có thể thực thi JavaScript', async ({ page }) => {
    await page.goto('about:blank');
    const result = await page.evaluate(() => 1 + 1);
    expect(result).toBe(2);
  });
});
