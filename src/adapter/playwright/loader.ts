// ─── File: adapter/playwright/loader.ts ────────────────────────────────────
// Loader cho Playwright -- resolve package playwright-core, kiểm tra version.
//
//   1. Tạo Loader instance target 'playwright', minimum 1.27.1
//   2. fallback packages: ['playwright-core']
//   3. load() trả về BrowserType chromium
// ─────────────────────────────────────────────────────────────────────────────

import Loader from '../../loader';

const loader: Loader = new Loader('playwright', '1.27.1', ['playwright-core']);

export default loader;
