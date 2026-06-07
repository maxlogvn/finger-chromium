// ─── File: loader.ts ─────────────────────────────────────────────────────
// Loader instance cho playwright package.
//
//   1. Khởi tạo Loader với target 'playwright'
//   2. Export singleton instance
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import Loader from '../../loader';

// ─── Constants ───────────────────────────────────────────────────────────────

const loader: Loader = new Loader('playwright', '1.27.1', ['playwright-core']);

// ─── Export ──────────────────────────────────────────────────────────────────

export default loader;