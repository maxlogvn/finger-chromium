// ─── File: tests/helpers.ts ────────────────────────────────────────────────
// Tiện ích dùng chung cho toàn bộ test -- tránh boilerplate trùng lặp.
//
//   1. skipTestIfNoKey() -- kiểm tra BABLOSOFT_KEY, trả về true nếu thiếu
//   2. createEngine() -- factory tạo BrowserEngine instance
//   3. withEngine() -- lifecycle wrapper: tạo → dùng → tự động quit()
//   4. Mock constants -- object hợp lệ cho các option types
// ─────────────────────────────────────────────────────────────────────────────

import { MissingKeyError } from '../src/plugin/errors';
import { BrowserEngine } from '../src/adapter/playwright/fluent';

import type { Launcher } from '../src/adapter/playwright/fluent';
import type { FingerprintOptions } from '../src/types/fingerprint';
import type { ProxyOptions } from '../src/types/proxy';
import type { ProfileOptions } from '../src/types/profile';
import type { FetchOptions } from '../src/types/fetch';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Key bảo mật từ biến môi trường BABLOSOFT_KEY.
 * Dùng cho mọi test cần tương tác với engine hoặc fetch fingerprint.
 * Set bằng lệnh: `$env:BABLOSOFT_KEY = "your-key"`
 */
export const PRIVATE_KEY = process.env.BABLOSOFT_KEY ?? '';

// ─── skipTestIfNoKey ──────────────────────────────────────────────────────────

/**
 * Kiểm tra BABLOSOFT_KEY có tồn tại và không rỗng.
 * Trả về `true` nếu thiếu key để test gọi `this.skip()` hoặc return sớm.
 *
 * Dùng ở đầu `describe()` hoặc `it()` với `function` keyword
 * (không dùng arrow function) vì Mocha context `this` chỉ hoạt động
 * với function truyền thống.
 *
 * @example
 * ```ts
 * describe('cần key', function () {
 *   if (skipTestIfNoKey()) return;
 *   it('test ...', () => { ... });
 * });
 * ```
 */
export function skipTestIfNoKey(): boolean {
  if (PRIVATE_KEY) return false;

  console.warn(
    '[skipTestIfNoKey] BABLOSOFT_KEY chưa được set. Bỏ qua test.\n' +
    'Set key bằng lệnh: $env:BABLOSOFT_KEY = "your-key"'
  );
  return true;
}

// ─── createEngine ─────────────────────────────────────────────────────────────

/**
 * Tạo BrowserEngine instance mới.
 * Dùng key từ tham số hoặc fallback về PRIVATE_KEY (từ env).
 * Luôn gọi `engine.quit()` sau khi dùng xong để tránh rò rỉ tiến trình.
 *
 * @param key - Key bablosoft (optional, fallback về process.env.BABLOSOFT_KEY)
 * @param launcher - Playwright launcher tuỳ chỉnh (optional)
 * @returns BrowserEngine instance sẵn sàng để launch
 * @throws MissingKeyError nếu không có key
 *
 * @example
 * ```ts
 * const engine = createEngine();
 * const ctx = await engine.launch().newContext();
 * // ... test ...
 * await engine.quit();
 * ```
 */
export function createEngine(key?: string, launcher?: Launcher): BrowserEngine {
  const resolvedKey = key !== undefined ? key : PRIVATE_KEY;

  if (!resolvedKey) {
    throw new MissingKeyError(
      'Cần set BABLOSOFT_KEY để tạo BrowserEngine instance.'
    );
  }

  const engine = launcher ? new BrowserEngine(launcher) : new BrowserEngine();

  (engine as unknown as { privateKey: string }).privateKey = resolvedKey;

  return engine;
}

// ─── withEngine ───────────────────────────────────────────────────────────────

/**
 * Tạo BrowserEngine, gọi callback với engine, tự động quit() trong finally.
 * Nuốt lỗi từ quit() để không che mất lỗi từ callback.
 *
 * @param fn - Callback nhận engine và trả về Promise
 * @param key - Key bablosoft (optional, fallback về process.env.BABLOSOFT_KEY)
 * @param launcher - Playwright launcher tuỳ chỉnh (optional)
 *
 * @example
 * ```ts
 * await withEngine(async (engine) => {
 *   const ctx = await engine.launch().newContext();
 *   // ... test với ctx ...
 * });
 * ```
 */
export async function withEngine(
  fn: (engine: BrowserEngine) => Promise<void>,
  key?: string,
  launcher?: Launcher
): Promise<void> {
  const engine = createEngine(key, launcher);

  try {
    await fn(engine);
  } finally {
    await engine.quit().catch(() => {
      // Nuốt lỗi từ quit() để không che mất lỗi từ callback
    });
  }
}

// ─── Mock Constants ───────────────────────────────────────────────────────────

/**
 * FingerprintOptions hợp lệ dùng trong test không cần engine thật.
 * Tất cả đều set `false` để tránh phụ thuộc vào dữ liệu fingerprint thật.
 */
export const MOCK_FINGERPRINT_OPTIONS: FingerprintOptions = {
  emulateDeviceScaleFactor: false,
  emulateSensorAPI: false,
  usePerfectCanvas: false,
  useFontPack: false,
  safeElementSize: false,
  safeBattery: false,
  safeCanvas: false,
  safeAudio: false,
  safeWebGL: false,
};

/**
 * ProxyOptions hợp lệ dùng trong test không cần proxy thật.
 * Tắt tunneling và WebRTC để tránh phụ thuộc vào proxy server.
 */
export const MOCK_PROXY_OPTIONS: ProxyOptions = {
  changeBrowserLanguage: false,
  changeGeolocation: false,
  changeTimezone: false,
  changeWebRTC: 'disable',
  enableTunneling: false,
  enableQUIC: false,
  dnsMode: 'system-proxy',
};

/**
 * ProfileOptions hợp lệ dùng trong test không cần profile thật.
 * Tắt load proxy/fingerprint để test không phụ thuộc vào profile cũ.
 */
export const MOCK_PROFILE_OPTIONS: ProfileOptions = {
  loadProxy: false,
  loadFingerprint: false,
};

/**
 * Fingerprint data JSON tối thiểu dùng trong smoke test.
 * Vì MOCK_FINGERPRINT_OPTIONS tắt hết tính năng, engine không xử lý data này.
 */
export const MOCK_FINGERPRINT_DATA = '{}';
