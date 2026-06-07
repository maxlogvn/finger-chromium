// ─── File: fixtures.ts ────────────────────────────────────────────────────────
// Custom Playwright fixtures cho browser-with-fingerprints.
//
//   - page         : fixture đơn giản, 1 engine + 1 context + 1 page
//   - launchContext: factory, mỗi test tự định nghĩa bao nhiêu context tùy ý
//
// Dùng:
//   import { test, expect } from './fixtures';
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ──────────────────────────────────────────────────────────────────

import { test as base } from '@playwright/test';
import type { BrowserContext, Page } from 'playwright-core';
import {
  chromium as BrowserEngine,
  type FingerprintOptions,
  type ProfileOptions,
  type ProxyOptions,
  type PluginLaunchOptions,
} from '../src';


// ─── Types ────────────────────────────────────────────────────────────────────

export type ContextConfig = {
  profileDir?: {
    path: string;
    options?: ProfileOptions;
  };
  fingerprint?: {
    data: string;
    options?: FingerprintOptions;
  };
  proxy?: {
    data: string;
    options?: ProxyOptions;
  };
  launchOptions?: Partial<PluginLaunchOptions>;
};

export type ContextHandle = {
  page: Page;
  context: BrowserContext;
  engine: InstanceType<typeof BrowserEngine>;
};

type LaunchContext = (config?: ContextConfig) => Promise<ContextHandle>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const test = base.extend<{
  page: Page;
  launchContext: LaunchContext;
}>({
  // ─── page ──────────────────────────────────────────────────────────────────
  // Engine mặc định, không cần cấu hình thêm.
  // Dùng cho các test đơn giản không cần fingerprint/proxy/profile.
  page: async ({}, use) => {
    const engine = new BrowserEngine().launch();
    const context = await engine.newContext();
    const page = await context.newPage();

    await use(page);

    await engine.close();
  },

  // ─── launchContext ─────────────────────────────────────────────────────────
  // Factory: mỗi test tự gọi bao nhiêu lần tùy ý, mỗi lần tạo 1 engine riêng.
  // Fixture tự dọn tất cả engine sau khi test xong.
  launchContext: async ({}, use) => {
    const engines: InstanceType<typeof BrowserEngine>[] = [];

    const factory: LaunchContext = async (config = {}) => {
      const builder = new BrowserEngine();
      if (config.profileDir) {
        builder.useProfile(config.profileDir.path, config.profileDir.options);
      }
      if (config.fingerprint) {
        builder.useFingerprint(config.fingerprint.data, config.fingerprint.options);
      }
      if (config.proxy) {
        builder.useProxy(config.proxy.data, config.proxy.options);
      }

      const engine = builder.launch(config.launchOptions);
      engines.push(engine);

      const context = await engine.newContext();
      const page = await context.newPage();

      return { page, context, engine };
    };

    await use(factory);

    // ─── Cleanup ──────────────────────────────────────────────────────────
    // Đóng theo thứ tự ngược để tránh phụ thuộc giữa các engine
    for (const engine of engines.reverse()) {
      await engine.close();
    }
  },
});

export { expect } from '@playwright/test';
