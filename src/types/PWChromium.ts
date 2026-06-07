import type { BrowserContext } from 'playwright-core';
import type { PluginLaunchOptions } from '../adapter/playwright/fluent';

/**
 * Interface điều khiển trình duyệt Chromium với hỗ trợ fingerprint, proxy và profile.
 *
 * Các method cấu hình (useFingerprint, useProxy, useProfile, usePrivateKey)
 * phải được gọi trước launch(). Sau khi launch() được gọi, cấu hình sẽ không thể thay đổi.
 *
 * @example
 * ```ts
 * const browser: PWChromium = new BrowserEngine();
 *
 * const context = await browser
 *   .usePrivateKey('your-private-key')
 *   .useFingerprint(fingerprintData, { usePerfectCanvas: true })
 *   .useProxy('http://user:pass@host:port', { changeTimezone: true })
 *   .useProfile('./profiles/user_01', { loadFingerprint: true })
 *   .launch({ headless: false })
 *   .newContext();
 *
 * const page = await context.newPage();
 * await page.goto('https://example.com');
 *
 * await browser.quit('./profiles/user_01');
 * ```
 */
export interface PWChromium {
  /**
   * Khởi tạo engine với toàn bộ cấu hình đã thiết lập.
   *
   * Bắt buộc phải gọi trước newContext().
   * Chỉ được gọi một lần trong vòng đời của instance —
   * gọi lại sẽ ném lỗi.
   *
   * @param options - Override các tùy chọn launch mặc định (headless, viewport...).
   * @throws {Error} Nếu gọi lại sau khi đã launch.
   *
   * @example
   * browser.launch({ headless: false })
   */
  launch(options?: Partial<PluginLaunchOptions>): this;

  /**
   * Tạo một BrowserContext để bắt đầu phiên duyệt web.
   *
   * Bắt buộc phải gọi launch() trước. Mỗi instance chỉ cho phép
   * một context tồn tại tại một thời điểm — cần gọi quit() để
   * đóng context hiện tại trước khi tạo mới.
   *
   * @param options - Override các tùy chọn context (viewport, locale...).
   * @returns BrowserContext của Playwright để tạo page và thao tác với trình duyệt.
   * @throws {Error} Nếu chưa gọi launch().
   * @throws {Error} Nếu context đã tồn tại.
   *
   * @example
   * const context = await browser.newContext();
   * const page = await context.newPage();
   * await page.goto('https://example.com');
   */
  newContext(options?: Partial<PluginLaunchOptions>): Promise<BrowserContext>;

  /**
   * Đóng trình duyệt, giải phóng tài nguyên và lưu profile.
   *
   * Nếu đã gọi useProfile(), profile sẽ được lưu về đường dẫn đó.
   * Truyền saveDataPath để ghi đè đường dẫn lưu profile cho lần quit() này.
   * Gọi khi chưa launch() sẽ không làm gì.
   *
   * @param saveDataPath - Ghi đè đường dẫn lưu profile, ưu tiên hơn path trong useProfile().
   *
   * @example
   * await browser.quit();                          // lưu về path đã dùng trong useProfile
   * await browser.quit('./profiles/user_backup');  // lưu về path khác
   */
  close(saveDataPath?: string): Promise<void>;
}
