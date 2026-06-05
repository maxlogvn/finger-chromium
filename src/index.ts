// ─── File: src/index.ts ────────────────────────────────────────────────────
// Public API -- export tất cả type, class và error cho người dùng thư viện.
//
//   1. PWChromium -- interface chính
//   2. BrowserEngine -- class (dùng new BrowserEngine())
//   3. PluginError, MissingKeyError, ... -- error classes để catch lỗi đúng type
//   4. FetchOptions, FingerprintOptions, Launcher, PluginLaunchOptions,
//      ProfileOptions, ProxyOptions -- type hỗ trợ
// ─────────────────────────────────────────────────────────────────────────────

export { type PWChromium } from './types/PWChromium';

export {
  PluginError,
  MissingKeyError,
  InvalidEngineError,
  EngineTimeoutError,
  RequestTimeoutError,
} from './plugin/errors';

export {
  BrowserEngine,
  type FetchOptions,
  type FingerprintOptions,
  type Launcher,
  type PluginLaunchOptions,
  type ProfileOptions,
  type ProxyOptions,
} from './adapter/playwright/fluent';
