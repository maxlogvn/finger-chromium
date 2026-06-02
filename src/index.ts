// ─── File: src/index.ts ────────────────────────────────────────────────────
// Public API -- export tất cả type và class cho người dùng thư viện.
//
//   1. PWChromium -- interface chính
//   2. Chromium -- singleton instance
//   3. FetchOptions, FingerprintOptions, Launcher, PluginLaunchOptions,
//      ProfileOptions, ProxyOptions -- type hỗ trợ
// ─────────────────────────────────────────────────────────────────────────────

export { type PWChromium } from './types/PWChromium';

export {
  Chromium,
  type FetchOptions,
  type FingerprintOptions,
  type Launcher,
  type PluginLaunchOptions,
  type ProfileOptions,
  type ProxyOptions,
} from './adapter/playwright/chromium';
