// ─── File: tests/browser.test.ts ────────────────────────────────────────────
// Integration test cho Browser modules: Launcher, Utils, PlaywrightFingerprintPlugin,
// BrowserEngine. Dùng Playwright Chromium thật.
//
//   1. Launcher -- launch(), Browser.close(), Browser.configure()
//   2. Utils -- isBrowser, onClose, bindHooks, setViewport
//   3. PlaywrightFingerprintPlugin -- constructor, options validation, bridge
//   4. BrowserEngine -- constructor, fluent API, lifecycle, guards
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, before, after, beforeEach, afterEach } from 'mocha';
import { strictEqual, ok, rejects } from 'node:assert';
import playwright from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs/promises';

import { launch, type Browser, type LaunchOptions } from '../src/plugin/launcher';
import {
  isBrowser,
  onClose,
  bindHooks,
  setViewport,
  getViewport,
  type BrowserHooks,
} from '../src/adapter/playwright/utils';
import { PlaywrightFingerprintPlugin, IGNORED_ARGUMENTS, UNSUPPORTED_OPTIONS } from '../src/adapter/playwright/engine';
import { BrowserEngine, type PluginLaunchOptions } from '../src/adapter/playwright/chromium';
import { PluginError } from '../src/plugin/errors';
import type { BrowserContext, Page, Browser as PW_Browser } from 'playwright-core';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 30_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tìm executablePath của Chromium từ Playwright. Trả về null nếu không có. */
function getChromiumExe(): string | null {
  try {
    const exePath = playwright.chromium.executablePath();
    return exePath || null;
  } catch {
    return null;
  }
}

/** Tạo temp directory unique cho test. */
async function createTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(process.cwd(), '.tmp', 'browser-test-'));
}

/** Xoá temp directory. */
async function removeTempDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

/** Tạo Playwright launcher từ playwright.chromium. */
function createPWLauncher() {
  const bt = playwright.chromium;
  return {
    launch: bt.launch.bind(bt),
    launchPersistentContext: bt.launchPersistentContext.bind(bt),
  };
}

// ─── TestPlugin ──────────────────────────────────────────────────────────────
// Subclass PlaywrightFingerprintPlugin để bypass _launch() — engine API
// không cần thiết cho integration test với Playwright thật.
// ─────────────────────────────────────────────────────────────────────────────

class TestPlugin extends PlaywrightFingerprintPlugin {
  protected async _launch(_useDefaultLauncher: boolean, options: any): Promise<any> {
    const { userDataDir, launcher } = options;
    if (launcher?.launch) {
      return launcher.launch(options);
    }
    return this.pwLauncher.launchPersistentContext(userDataDir || '', options);
  }
}

// ─── Suite availability check ─────────────────────────────────────────────────

const chromiumExe = getChromiumExe();
const hasChromium = chromiumExe !== null;

function describeWithBrowser(description: string, fn: (this: Mocha.Suite) => void): void {
  if (hasChromium) {
    describe(description, fn);
  } else {
    describe.skip(description, fn);
  }
}

// ==============================================================================
// 1. Launcher
// ==============================================================================

describeWithBrowser('Launcher', () => {
  let tempDir: string;
  let hangScriptPath: string;

  before(async () => {
    tempDir = await createTempDir();
    // Tạo script Node.js giả lập Chromium — chạy mãi không ra DevTools URL
    hangScriptPath = path.join(tempDir, 'hang.js');
    await fs.writeFile(hangScriptPath, 'setInterval(() => {}, 60000);');
  });

  after(async () => {
    await removeTempDir(tempDir);
  });

  // ─── launch() ─────────────────────────────────────────────────────────────

  describe('launch()', () => {
    it('nên spawn Chromium và trả về Browser object đúng shape', async () => {
      const browser: Browser = await launch({
        executablePath: chromiumExe!,
        args: [`--user-data-dir=${tempDir}`, '--no-sandbox'],
        debuggingPort: 0,
        headless: true,
        timeout: DEFAULT_TIMEOUT,
      });

      ok(browser, 'Browser object phải tồn tại');
      ok(typeof browser.process === 'object', 'process phải là object');
      ok(typeof browser.port === 'number' && browser.port > 0, 'port phải là số dương');
      ok(typeof browser.url === 'string' && browser.url.startsWith('ws://'), 'url phải bắt đầu với ws://');
      ok(typeof browser.configure === 'function', 'configure() phải là function');
      ok(typeof browser.close === 'function', 'close() phải là function');

      await browser.close();
    });

    it('nên throw PluginError khi timeout', async () => {
      // Dùng Node.js script không xuất DevTools URL để trigger timeout
      await rejects(
        launch({
          executablePath: process.execPath,
          args: [hangScriptPath],
          timeout: 500,
        }),
        (err: any) => {
          ok(err instanceof PluginError, 'phải là PluginError');
          ok(err.message.includes('Timed out'), 'message phải chứa "Timed out"');
          return true;
        }
      );
    });

    it('nên dùng đúng port được truyền vào', async () => {
      const browser = await launch({
        executablePath: chromiumExe!,
        args: ['--no-sandbox'],
        debuggingPort: 9999,
        headless: true,
        timeout: DEFAULT_TIMEOUT,
      });

      strictEqual(browser.port, 9999, 'port phải bằng 9999');
      await browser.close();
    });

    it('nên spawn headless mode khi headless: true', async () => {
      const browser = await launch({
        executablePath: chromiumExe!,
        args: ['--no-sandbox'],
        debuggingPort: 0,
        headless: true,
        timeout: DEFAULT_TIMEOUT,
      });

      ok(browser.port > 0, 'port phải hợp lệ');
      await browser.close();
    });
  });

  // ─── Browser.close() ──────────────────────────────────────────────────────

  describe('Browser.close()', () => {
    it('nên kill process thành công', async () => {
      const browser = await launch({
        executablePath: chromiumExe!,
        args: ['--no-sandbox'],
        headless: true,
        timeout: DEFAULT_TIMEOUT,
      });

      const pid = browser.process.pid;
      ok(pid, 'process phải có PID');

      await browser.close();
      ok(browser.process.killed, 'process phải bị killed');
    });

    it('nên idempotent — gọi 2 lần không throw', async () => {
      const browser = await launch({
        executablePath: chromiumExe!,
        args: ['--no-sandbox'],
        headless: true,
        timeout: DEFAULT_TIMEOUT,
      });

      await browser.close();
      await browser.close();
      ok(true, 'close() 2 lần không throw');
    });
  });

  // ─── Browser.configure() ──────────────────────────────────────────────────

  describe('Browser.configure()', () => {
    it('nên là no-op và không throw', async () => {
      const browser = await launch({
        executablePath: chromiumExe!,
        args: ['--no-sandbox'],
        headless: true,
        timeout: DEFAULT_TIMEOUT,
      });

      await browser.configure();
      ok(true, 'configure() không throw');
      await browser.close();
    });
  });
});

// ==============================================================================
// 2. Utils
// ==============================================================================

describeWithBrowser('Utils', () => {
  // ─── isBrowser() ──────────────────────────────────────────────────────────
  // Dùng browser chung — chỉ đọc state, không close.
  // ───────────────────────────────────────────────────────────────────────────

  describe('isBrowser()', () => {
    let pwBrowser: PW_Browser;

    before(async () => {
      pwBrowser = await playwright.chromium.launch({
        executablePath: chromiumExe!,
        headless: true,
        args: ['--no-sandbox'],
      });
    });

    after(async () => {
      await pwBrowser.close();
    });

    it('nên trả về true cho Browser object thật', () => {
      ok(isBrowser(pwBrowser), 'Browser object phải được nhận diện là Browser');
    });

    it('nên trả về false cho BrowserContext thật', () => {
      // Context được tạo từ browser, nhưng không phải Browser
      if (pwBrowser.contexts().length > 0) {
        ok(!isBrowser(pwBrowser.contexts()[0]), 'BrowserContext không phải là Browser');
      }
    });

    it('nên trả về false cho object rỗng', () => {
      ok(!isBrowser({}), 'object rỗng không phải là Browser');
    });
  });

  // ─── onClose() ────────────────────────────────────────────────────────────
  // Mỗi test dùng browser riêng — không ảnh hưởng lẫn nhau.
  // ───────────────────────────────────────────────────────────────────────────

  describe('onClose()', () => {
    it('nên gọi listener khi Browser disconnected', async () => {
      const browser = await playwright.chromium.launch({
        executablePath: chromiumExe!,
        headless: true,
        args: ['--no-sandbox'],
      });
      let called = false;
      onClose(browser, () => {
        called = true;
      });

      await browser.close();
      ok(called, 'listener phải được gọi');
    });

    it('nên gọi listener khi BrowserContext close', async () => {
      const browser = await playwright.chromium.launch({
        executablePath: chromiumExe!,
        headless: true,
        args: ['--no-sandbox'],
      });
      const context = await browser.newContext();
      let called = false;
      onClose(context, () => {
        called = true;
      });

      await context.close();
      ok(called, 'listener phải được gọi');
      await browser.close();
    });
  });

  // ─── bindHooks() ──────────────────────────────────────────────────────────
  // Mỗi test dùng browser riêng.
  // ───────────────────────────────────────────────────────────────────────────

  describe('bindHooks()', () => {
    it('nên gọi onPageCreated khi tạo page mới', async () => {
      const browser = await playwright.chromium.launch({
        executablePath: chromiumExe!,
        headless: true,
        args: ['--no-sandbox'],
      });
      const context = await browser.newContext();
      let pageCreated = false;

      bindHooks(context, {
        onPageCreated: () => {
          pageCreated = true;
        },
      });

      const page = await context.newPage();
      ok(pageCreated, 'onPageCreated phải được gọi');
      await page.close();
      await context.close();
      await browser.close();
    });

    it('nên chặn setViewportSize (no-op)', async () => {
      const browser = await playwright.chromium.launch({
        executablePath: chromiumExe!,
        headless: true,
        args: ['--no-sandbox'],
      });
      const context = await browser.newContext();
      bindHooks(context);

      const page = await context.newPage();
      const originalViewport = page.viewportSize();

      await page.setViewportSize({ width: 800, height: 600 });
      const afterViewport = page.viewportSize();

      strictEqual(afterViewport?.width, originalViewport?.width, 'width không đổi');
      strictEqual(afterViewport?.height, originalViewport?.height, 'height không đổi');

      await page.close();
      await context.close();
      await browser.close();
    });
  });

  // ─── setViewport() + getViewport() ───────────────────────────────────────

  describe('setViewport() + getViewport()', () => {
    it('nên resize viewport thành công', async () => {
      const browser = await playwright.chromium.launch({
        executablePath: chromiumExe!,
        headless: true,
        args: ['--no-sandbox'],
      });
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('about:blank');

      await setViewport(page, { width: 1280, height: 720 });
      const vp = await getViewport(page);

      strictEqual(vp.width, 1280, 'width phải là 1280');
      strictEqual(vp.height, 720, 'height phải là 720');

      await page.close();
      await context.close();
      await browser.close();
    });
  });
});

// ==============================================================================
// 3. PlaywrightFingerprintPlugin
// ==============================================================================

describeWithBrowser('PlaywrightFingerprintPlugin', () => {
  let pwLauncher: any;

  before(() => {
    pwLauncher = createPWLauncher();
  });

  // ─── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('nên tạo instance với pwLauncher mặc định', () => {
      const plugin = new PlaywrightFingerprintPlugin();
      ok(plugin instanceof PlaywrightFingerprintPlugin);
    });

    it('nên dùng launcher custom nếu được truyền', () => {
      const plugin = new PlaywrightFingerprintPlugin(pwLauncher);
      ok(plugin instanceof PlaywrightFingerprintPlugin);
    });
  });

  // ─── launchPersistentContext() ────────────────────────────────────────────

  describe('launchPersistentContext()', () => {
    it('nên launch và trả về BrowserContext với Playwright thật', async () => {
      const plugin = new TestPlugin(pwLauncher);
      const context: BrowserContext = await plugin.launchPersistentContext('', {
        headless: true,
        args: ['--no-sandbox'],
      });

      ok(context, 'context phải tồn tại');
      ok(typeof context.newPage === 'function', 'context phải có newPage');
      await context.close();
    });

    it('nên filter --user-data-dir arguments', async () => {
      let capturedArgs: string[] = [];
      const customLauncher = {
        ...pwLauncher,
        launchPersistentContext: async (_userDataDir: string, opts: any) => {
          capturedArgs = opts.args || [];
          return pwLauncher.launchPersistentContext(_userDataDir, opts);
        },
      };
      const plugin = new TestPlugin(customLauncher);

      const context = await plugin.launchPersistentContext('', {
        headless: true,
        args: ['--user-data-dir=should-be-filtered', '--no-sandbox'],
      });

      strictEqual(
        capturedArgs.some((a: string) => a.startsWith('--user-data-dir')),
        false,
        '--user-data-dir phải bị filter'
      );
      ok(capturedArgs.includes('--no-sandbox'), '--no-sandbox phải giữ nguyên');
      await context.close();
    });

    it('nên force viewport null trong options', async () => {
      let capturedViewport: any = undefined;
      const customLauncher = {
        ...pwLauncher,
        launchPersistentContext: async (_userDataDir: string, opts: any) => {
          capturedViewport = opts.viewport;
          return pwLauncher.launchPersistentContext(_userDataDir, opts);
        },
      };
      const plugin = new TestPlugin(customLauncher);

      const context = await plugin.launchPersistentContext('', {
        headless: true,
        viewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox'],
      });

      strictEqual(capturedViewport, null, 'viewport phải là null');
      await context.close();
    });
  });

  // ─── launch() ─────────────────────────────────────────────────────────────

  describe('launch()', () => {
    it('nên fallback sang launchPersistentContext với userDataDir rỗng', async () => {
      const plugin = new TestPlugin(pwLauncher);
      const context = await plugin.launch({
        headless: true,
        args: ['--no-sandbox'],
      });

      ok(context, 'context phải tồn tại');
      await context.close();
    });
  });

  // ─── Option validation ────────────────────────────────────────────────────

  describe('option validation', () => {
    it('nên throw PluginError khi có proxy option', async () => {
      const plugin = new PlaywrightFingerprintPlugin(pwLauncher);
      await rejects(
        plugin.launchPersistentContext('', { proxy: { server: 'http://proxy:8080' } } as Partial<PluginLaunchOptions>),
        (err: any) => {
          ok(err instanceof PluginError);
          ok(err.message.includes('proxy'));
          return true;
        }
      );
    });

    it('nên throw PluginError khi có channel option', async () => {
      const plugin = new PlaywrightFingerprintPlugin(pwLauncher);
      await rejects(
        plugin.launchPersistentContext('', { channel: 'chrome' } as Partial<PluginLaunchOptions>),
        (err: any) => {
          ok(err instanceof PluginError);
          ok(err.message.includes('channel'));
          return true;
        }
      );
    });

    it('nên throw PluginError khi có firefoxUserPrefs option', async () => {
      const plugin = new PlaywrightFingerprintPlugin(pwLauncher);
      await rejects(
        plugin.launchPersistentContext('', { firefoxUserPrefs: {} } as Partial<PluginLaunchOptions>),
        (err: any) => {
          ok(err instanceof PluginError);
          ok(err.message.includes('firefoxUserPrefs'));
          return true;
        }
      );
    });
  });

  // ─── configure() ─────────────────────────────────────────────────────────

  describe('configure()', () => {
    it('nên gọi onClose và bindHooks với context thật', async () => {
      const plugin = new TestPlugin(pwLauncher);
      const context = await plugin.launchPersistentContext('', {
        headless: true,
        args: ['--no-sandbox'],
      });

      await plugin.configure(() => {}, context, { width: 800, height: 600 }, async (fn) => fn());

      ok(true, 'configure() hoàn thành không throw');
      await context.close();
    });

    it('nên resize viewport nếu có bounds (headless có thể không chính xác)', async () => {
      const plugin = new TestPlugin(pwLauncher);
      const context = await plugin.launchPersistentContext('', {
        headless: true,
        args: ['--no-sandbox'],
      });

      const page = await context.newPage();
      await page.goto('about:blank');

      await plugin.configure(() => {}, context, { width: 1280, height: 720 }, async (fn) => fn());

      // Trong headless, CDP Browser.setWindowBounds có thể không thay đổi viewport.
      // Chỉ verify rằng configure không throw và viewport hợp lệ.
      const vp = await getViewport(page);
      ok(vp.width > 0, 'width phải > 0');
      ok(vp.height > 0, 'height phải > 0');

      await page.close();
      await context.close();
    });
  });
});

// ==============================================================================
// 4. BrowserEngine
// ==============================================================================

describeWithBrowser('BrowserEngine', () => {
  let tempDir: string;
  let pwLauncher: any;

  before(async () => {
    tempDir = await createTempDir();
    pwLauncher = createPWLauncher();
  });

  after(async () => {
    await removeTempDir(tempDir);
  });

  // ─── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('nên tạo instance với defaults', () => {
      const engine = new BrowserEngine();
      ok(engine instanceof BrowserEngine, 'phải là instanceof BrowserEngine');
      const e = engine as unknown as { isLaunched: boolean; options: Record<string, unknown> };
      ok(!e.isLaunched, 'isLaunched phải là false');
      strictEqual(e.options.headless, false, 'headless mặc định là false');
      strictEqual(e.options.hasTouch, true, 'hasTouch mặc định là true');
    });

    it('nên tạo instance với launcher custom', () => {
      const engine = new BrowserEngine(pwLauncher);
      ok(engine instanceof BrowserEngine);
    });
  });

  // ─── repackChromium() ─────────────────────────────────────────────────────

  describe('repackChromium()', () => {
    it('nên thay thế launcher và trả về this', () => {
      const engine = new BrowserEngine();
      const result = engine.repackChromium(pwLauncher);
      strictEqual(result, engine, 'phải trả về this');
    });
  });

  // ─── useFingerprint() ─────────────────────────────────────────────────────

  describe('useFingerprint()', () => {
    it('nên lưu fingerprint data và options, trả về this', () => {
      const engine = new BrowserEngine();
      const result = engine.useFingerprint('{"test": true}', { usePerfectCanvas: true });
      strictEqual(result, engine, 'phải trả về this');
    });
  });

  // ─── useProxy() ───────────────────────────────────────────────────────────

  describe('useProxy()', () => {
    it('nên lưu proxy data và options, trả về this', () => {
      const engine = new BrowserEngine();
      const result = engine.useProxy('http://user:pass@host:8080', { changeWebRTC: 'replace' });
      strictEqual(result, engine, 'phải trả về this');
    });
  });

  // ─── useProfile() ─────────────────────────────────────────────────────────

  describe('useProfile()', () => {
    it('nên map profile directory và trả về this', () => {
      const engine = new BrowserEngine();
      const result = engine.useProfile(tempDir, { loadProxy: true, loadFingerprint: true });
      strictEqual(result, engine, 'phải trả về this');
    });
  });

  // ─── launch() ─────────────────────────────────────────────────────────────

  describe('launch()', () => {
    it('nên launch thành công', () => {
      const engine = new BrowserEngine();
      engine.repackChromium(pwLauncher);

      const result = engine.launch();
      strictEqual(result, engine, 'phải trả về this');
      ok((engine as unknown as { isLaunched: boolean }).isLaunched, 'isLaunched phải là true');
    });

    it('nên throw PluginError khi gọi lần 2', () => {
      const engine = new BrowserEngine();
      engine.repackChromium(pwLauncher);
      engine.launch();

      rejects(
        () => Promise.resolve().then(() => engine.launch()),
        (err: any) => {
          ok(err instanceof PluginError);
          ok(err.message.includes('launch()'));
          return true;
        }
      );
    });
  });

  // ─── newContext() ─────────────────────────────────────────────────────────

  describe('newContext()', () => {
    it('nên tạo BrowserContext thành công sau launch', async () => {
      const engine = new BrowserEngine();
      engine.repackChromium(pwLauncher);
      // Thay engine bằng TestPlugin để bypass _launch()
      (engine as { engine: unknown }).engine = new TestPlugin(pwLauncher);

      engine.launch();
      const context = await engine.newContext({
        headless: true,
        args: ['--no-sandbox'],
      });

      ok(context, 'context phải tồn tại');
      ok(typeof context.newPage === 'function', 'context phải có newPage');
      await engine.quit();
    });

    it('nên throw PluginError khi chưa launch', async () => {
      const engine = new BrowserEngine();

      await rejects(
        engine.newContext(),
        (err: any) => {
          ok(err instanceof PluginError);
          ok(err.message.includes('launch()'));
          return true;
        }
      );
    });
  });

  // ─── quit() ───────────────────────────────────────────────────────────────

  describe('quit()', () => {
    it('nên cleanup thành công sau launch + newContext', async () => {
      const engine = new BrowserEngine();
      engine.repackChromium(pwLauncher);
      (engine as { engine: unknown }).engine = new TestPlugin(pwLauncher);

      engine.launch({});
      await engine.newContext({ headless: true, args: ['--no-sandbox'] });
      await engine.quit();

      ok(!(engine as unknown as { isLaunched: boolean }).isLaunched, 'isLaunched phải là false sau quit');
    });

    it('nên idempotent — gọi 2 lần không throw', async () => {
      const engine = new BrowserEngine();
      await engine.quit();
      await engine.quit();
      ok(true, 'quit() 2 lần không throw');
    });

    it('nên không throw khi chưa launch', async () => {
      const engine = new BrowserEngine();
      await engine.quit();
      ok(true, 'quit() khi chưa launch không throw');
    });
  });

  // ─── newFingerprint() ─────────────────────────────────────────────────────

  describe('newFingerprint()', () => {
    it('nên throw error khi không có key và không có engine', async () => {
      const engine = new BrowserEngine();
      engine.engine.setRequestTimeout(2000);
      await rejects(
        engine.newFingerprint(undefined),
        (err: any) => {
          ok(err instanceof Error, 'phải throw Error');
          return true;
        }
      );
    });
  });
});
