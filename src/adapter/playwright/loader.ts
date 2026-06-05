// ─── File: adapter/playwright/loader.ts ────────────────────────────────────
// Loader cho Playwright -- resolve package playwright-core, kiểm tra version.
//
//   1. Tạo Loader instance target 'playwright', minimum 1.27.1
//   2. fallback packages: ['playwright-core']
//   3. load() trả về BrowserType chromium
// ─────────────────────────────────────────────────────────────────────────────

import Loader from '../../loader';

/**
 * Loader instance cho Playwright.
 *
 * Sử dụng `playwright-core` làm fallback để hỗ trợ môi trường
 * chỉ cài package lõi, giảm kích thước cài đặt khi không cần
 * trình duyệt Fluent tích hợp sẵn của `playwright`.
 *
 * Version tối thiểu 1.27.1 đảm bảo có API `launchPersistentContext`
 * ổn định cho fingerprint và profile engine.
 */
const loader: Loader = new Loader('playwright', '1.27.1', ['playwright-core']);

export default loader;
