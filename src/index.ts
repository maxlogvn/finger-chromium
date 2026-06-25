// ─── File: index.ts ──────────────────────────────────────────────────────
// Entry point của package. Export toàn bộ public API.
//
//   1. Export types từ types/
//   2. Export error classes từ plugin/errors
//   3. Export BrowserEngine và các type từ adapter/playwright/fluent
// ─────────────────────────────────────────────────────────────────────────────

// ─── Export ──────────────────────────────────────────────────────────────────

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
  BrowserEngine as chromium,
  type FetchOptions,
  type FingerprintOptions,
  type Launcher,
  type PluginLaunchOptions,
  type ProfileOptions,
  type ProxyOptions,
} from './adapter/playwright/fluent';
