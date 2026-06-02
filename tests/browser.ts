import { Chromium } from '../src';
import type { PWChromium } from '../src';

export const DRIVEN_TEST_SITES = ['https://abrahamjuliot.github.io/creepjs/', 'https://fingerprint.com/'];

/**
 * Khởi chạy trình duyệt Chromium, điều hướng đến các trang test và chờ input bàn phím.
 */
export async function runChromiumTest(): Promise<void> {
  let browser: PWChromium | undefined;

  try {
    browser = Chromium.launch();
    const context = await browser.newContext();

    // Mở tuần tự từng trang để tránh overload server
    for (const url of DRIVEN_TEST_SITES) {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log(`[Chromium] Đã mở thành công: ${url}`);
    }
  } catch (error) {
    console.error('Lỗi khi chạy test Chromium:', error);
  } finally {
    if (browser) {
      await browser.quit();
      console.log('Đã đóng trình duyệt Chromium.');
    }
  }
}

runChromiumTest();
