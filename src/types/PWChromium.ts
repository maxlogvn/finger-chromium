// ─── File: types/PWChromium.ts ─────────────────────────────────────────────
// Interface public API của BrowserEngine -- Fluent API cho fingerprint,
// proxy, profile, launch, context management.
//
//   1. Cấu hình: useFingerprint, useProxy, useProfile, repackChromium
//   2. Khởi động: launch
//   3. Runtime: newContext, newFingerprint
//   4. Dọn dẹp: quit
// ─────────────────────────────────────────────────────────────────────────────

import type { BrowserContext } from 'playwright-core';
import type { FetchOptions, PluginLaunchOptions } from '../adapter/playwright/chromium';

/**
 * Interface điều khiển trình duyệt Chromium với hỗ trợ fingerprint, proxy và profile.
 *
 * Key bảo mật được đọc từ biến môi trường `BABLOSOFT_KEY` — set trước khi chạy.
 * Các method cấu hình (`useFingerprint`, `useProxy`, `useProfile`)
 * phải được gọi trước `launch()`. Sau khi `launch()` được gọi, cấu hình sẽ không thể thay đổi.
 *
 * @example
 * ```ts
 * // Set biến môi trường BABLOSOFT_KEY trước khi chạy
 * const browser: PWChromium = new BrowserEngine();
 *
 * const context = await browser
 *   .useFingerprint(fingerprintData, { usePerfectCanvas: true })
 *   .useProxy('http://user:pass@host:port', { changeTimezone: true })
 *   .useProfile('./profiles/user_01', { loadFingerprint: true })
 *   .launch({ headless: false })
 *   .newContext();
 *
 * const page = await context.newPage();
 * await page.goto('https://example.com');
 *
 * await browser.quit('./profiles/user_01'); // đóng và lưu profile
 * ```
 */
export interface PWChromium {
  /**
   * Truy cập instance engine gốc (dùng cho các tác vụ nâng cao).
   * Lưu ý: Sử dụng thuộc tính này có thể bỏ qua một số lớp bảo vệ của API chuẩn.
   */
  readonly engine: object;

  /**
   * Thay thế Chromium mặc định bằng một launcher tùy chỉnh.
   *
   * Launcher mặc định đã được patch sẵn để chống detection — chỉ dùng method này
   * khi có lý do đặc biệt và hiểu rõ rủi ro bị detect.
   * Cần gọi trước `launch()`.
   *
   * @param launcher - Launcher tùy chỉnh thay thế Chromium mặc định.
   *
   * @example
   * browser.repackChromium(customLauncher)
   */
  repackChromium(launcher: object): this;

  /**
   * Gắn fingerprint vào trình duyệt để giả lập thiết bị, tránh bị detect.
   *
   * Fingerprint chứa thông tin phần cứng, màn hình, trình duyệt...
   * giúp trình duyệt trông như một thiết bị thật.
   * Cần gọi trước `launch()`.
   *
   * @param data - Chuỗi fingerprint lấy từ service bablosoft.
   * @param options - Tùy chọn kiểm soát các kỹ thuật giả lập, xem {@link FingerprintOptions}.
   *
   * @example
   * browser.useFingerprint(fingerprintData, {
   *   usePerfectCanvas: true,
   *   safeWebGL: true,
   * })
   */
  useFingerprint(data: string, options?: object): this;

  /**
   * Định tuyến toàn bộ traffic của trình duyệt qua proxy.
   *
   * Hỗ trợ các giao thức HTTP, HTTPS, SOCKS4, SOCKS5.
   * Cần gọi trước `launch()`.
   *
   * @param data - Proxy string theo định dạng `protocol://user:pass@host:port`.
   * @param options - Tùy chọn bổ sung như đổi timezone, geolocation, WebRTC... xem {@link ProxyOptions}.
   *
   * @example
   * browser.useProxy('http://user:pass@127.0.0.1:8080', {
   *   changeTimezone: true,
   *   changeGeolocation: true,
   *   changeWebRTC: 'replace',
   * })
   */
  useProxy(data: string, options?: object): this;

  /**
   * Liên kết thư mục profile với trình duyệt.
   *
   * Profile lưu trữ cookies, localStorage, session, lịch sử đăng nhập...
   * giúp duy trì trạng thái giữa các phiên. Profile sẽ tự động được lưu
   * về `dirPath` khi gọi `quit()`.
   * Cần gọi trước `launch()`.
   *
   * @param dirPath - Đường dẫn thư mục lưu profile.
   * @param options - Tùy chọn load proxy/fingerprint từ profile, xem {@link ProfileOptions}.
   *
   * @example
   * browser.useProfile('./profiles/user_01', {
   *   loadProxy: true,
   *   loadFingerprint: true,
   * })
   */
  useProfile(dirPath: string, options?: object): this;

  newFingerprint(options: FetchOptions): Promise<string | undefined>;

  /**
   * Khởi tạo engine với toàn bộ cấu hình đã thiết lập.
   *
   * Bắt buộc phải gọi trước `newContext()`.
   * Chỉ được gọi một lần trong vòng đời của instance —
   * gọi lại sẽ ném lỗi.
   *
   * @param options - Override các tùy chọn launch mặc định (headless, viewport...).
   * @throws {Error} Nếu gọi lại sau khi đã launch.
   *
   * @example
   * browser.launch({ headless: false })
   */
  launch(options?: object): this;

  /**
   * Tạo một `BrowserContext` để bắt đầu phiên duyệt web.
   *
   * Bắt buộc phải gọi `launch()` trước. Mỗi instance chỉ cho phép
   * một context tồn tại tại một thời điểm — cần gọi `quit()` để
   * đóng context hiện tại trước khi tạo mới.
   *
   * @param options - Override các tùy chọn context (viewport, locale...).
   * @returns `BrowserContext` của Playwright để tạo page và thao tác với trình duyệt.
   * @throws {Error} Nếu chưa gọi `launch()`.
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
   * Nếu đã gọi `useProfile()`, profile sẽ được lưu về đường dẫn đó.
   * Truyền `saveDataPath` để ghi đè đường dẫn lưu profile cho lần `quit()` này.
   * Gọi khi chưa `launch()` sẽ không làm gì.
   *
   * @param saveDataPath - Ghi đè đường dẫn lưu profile, ưu tiên hơn path trong `useProfile()`.
   *
   * @example
   * await browser.quit();                          // lưu về path đã dùng trong useProfile
   * await browser.quit('./profiles/user_backup');  // lưu về path khác
   */
  quit(saveDataPath?: string): Promise<void>;
}
