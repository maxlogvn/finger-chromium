/**
 * Tùy chọn cấu hình profile cho trình duyệt.
 *
 * @example
 * ```ts
 * browser.useProfile('./profiles/user_01', {
 *   loadProxy: true,
 *   loadFingerprint: true,
 * });
 * ```
 */
export interface ProfileOptions {
  /**
   * Tự động load proxy đã dùng lần trước từ thư mục profile.
   *
   * @default true
   */
  loadProxy?: boolean;

  /**
   * Tự động load fingerprint đã dùng lần trước từ thư mục profile.
   *
   * @default true
   */
  loadFingerprint?: boolean;
}
