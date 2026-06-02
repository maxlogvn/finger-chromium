import type { BrowserContext } from 'playwright-core';
import { Chromium } from '../src/adapter/playwright/chromium';

export const LIST_PROFILE_DIR_PATH = ['.tmp/test/profile/user_test_1', '.tmp/test/profile/user_test_2'];

export const DRIVEN_TEST_SITES = ['chrome://version/', 'chrome://flags'];

/**
 * Mở danh sách trang web trong một BrowserContext đã cho.
 */
export async function openDrivenSites(context: BrowserContext): Promise<void> {
  for (const url of DRIVEN_TEST_SITES) {
    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log(`[Profile] Đã mở: ${url}`);
    } catch (err) {
      // Không chặn luồng chính nếu 1 trang lỗi
      console.warn(`⚠️ Không thể mở ${url}:`, err);
    }
  }
}

/**
 * Khởi chạy một phiên bản trình duyệt với profile cụ thể.
 */
export async function launchBrowserWithProfile(profilePath: string) {
  const engine = Chromium.useProfile(profilePath);
  const browser = engine.launch();
  const context = await browser.newContext();
  await openDrivenSites(context);
  return browser;
}

/**
 * Quản lý nhiều context trình duyệt song song theo từng profile.
 */
export async function runMultiContextTest(): Promise<void> {
  const browserList = [];
  for (const profile of LIST_PROFILE_DIR_PATH) {
    console.log(`🚀 Khởi chạy profile: ${profile}`);
    const browser = await launchBrowserWithProfile(profile);
    browserList.push(browser);
  }
  for (const browser of browserList) {
    await browser.quit();
  }
}

await runMultiContextTest();
