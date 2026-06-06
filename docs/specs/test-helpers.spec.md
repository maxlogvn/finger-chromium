# Spec: Test Utilities (`tests/helpers.ts`)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).
> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả

Tạo file `tests/helpers.ts` chứa các hàm và hằng số dùng chung cho toàn bộ test trong dự án. Các utility này giúp viết test ngắn gọn, nhất quán, tránh boilerplate trùng lặp như kiểm tra `BABLOSOFT_KEY`, tạo/huỷ `BrowserEngine`, và mock data cho options.

## Phạm vi

- **Trong phạm vi:**
  - Hàm `skipTestIfNoKey()` dùng trong Mocha `describe` hoặc `it`.
  - Hàm `createEngine()` tạo `BrowserEngine` instance với key từ env hoặc tham số.
  - Hàm `withEngine()` quản lý lifecycle tự động (tạo -> dùng -> quit).
  - Mock constants: `MOCK_FINGERPRINT_OPTIONS`, `MOCK_PROXY_OPTIONS`, `MOCK_PROFILE_OPTIONS`.
  - Hằng số `PRIVATE_KEY` để test dùng chung.
  - Hỗ trợ ESM qua `tsx` (Mocha đã cấu hình sẵn).

- **Ngoài phạm vi:**
  - Mock `BrowserEngine` class (dùng engine thật).
  - Utility cho các engine khác ngoài `BrowserEngine`.
  - Helper cho integration test với browser thật (sẽ có ở smoke test riêng).

## Yêu cầu

- **Functional:**
  - `skipTestIfNoKey()` trả về `true` nếu `BABLOSOFT_KEY` trống, để test gọi `this.skip()`.
  - `skipTestIfNoKey()` log warning kèm hướng dẫn set key khi skip.
  - `createEngine()` trả về `BrowserEngine` instance mới, dùng key từ env nếu không truyền.
  - `createEngine()` ném `MissingKeyError` nếu không có key.
  - `withEngine()` tạo engine, gọi callback, luôn gọi `engine.quit()` trong `finally`.
  - Mock constants đúng type `FingerprintOptions`, `ProxyOptions`, `ProfileOptions`.

- **Non-functional:**
  - File chạy được với `tsx` (ESM).
  - Zero dependency ngoài project (chỉ dùng các module đã có).
  - JSDoc đầy đủ cho tất cả export.

## Phụ thuộc

- `BrowserEngine`, `PluginError`, `MissingKeyError` từ `src/`.
- `FetchOptions`, `FingerprintOptions`, `ProxyOptions`, `ProfileOptions` từ `src/types/`.
- Mocha `this.skip()` context (chỉ hoạt động trong `function()` không phải arrow).

## Thiết kế

Tham chiếu: `docs/designs/test-helpers.design.md`

File đơn `tests/helpers.ts` với các export named. Kiến trúc tổng thể:

```
tests/helpers.ts
├── PRIVATE_KEY        (hằng số)
├── skipTestIfNoKey()  (chức năng)
├── createEngine()     (chức năng)
├── withEngine()       (chức năng)
├── MOCK_FINGERPRINT_OPTIONS  (mock constant)
├── MOCK_PROXY_OPTIONS        (mock constant)
└── MOCK_PROFILE_OPTIONS      (mock constant)
```

## API / Data flow

### `PRIVATE_KEY`

Kiểu: `string`

Lấy từ `process.env.BABLOSOFT_KEY`. Dùng để kiểm tra key availability.

### `skipTestIfNoKey(): boolean`

- **Input:** Không có (đọc `PRIVATE_KEY` hoặc `process.env.BABLOSOFT_KEY`).
- **Output:** `true` nếu key trống, `false` nếu có key.
- **Side effect:** Log `console.warn` nếu skip.
- **Cách dùng:**
  ```ts
  describe('my test', function () {
    if (skipTestIfNoKey()) return; // skip cả describe

    it('should work', function () {
      // ...
    });
  });
  ```

### `createEngine(key?: string, launcher?: Launcher): BrowserEngine`

- **Input:**
  - `key` — key bablosoft (optional, fallback về `PRIVATE_KEY`).
  - `launcher` — Playwright launcher tùy chỉnh (optional).
- **Output:** `BrowserEngine` instance.
- **Lỗi:** `MissingKeyError` nếu cả `key` và `PRIVATE_KEY` đều trống.
- **Cách dùng:**
  ```ts
  const engine = createEngine();
  // dùng engine...
  await engine.quit();
  ```

### `withEngine(fn: (engine: BrowserEngine) => Promise<void>, key?: string, launcher?: Launcher): Promise<void>`

- **Input:**
  - `fn` — callback nhận engine và trả về Promise.
  - `key` — key bablosoft (optional).
  - `launcher` — Playwright launcher tùy chỉnh (optional).
- **Output:** `Promise<void>`, resolve sau khi callback hoàn thành và engine đã quit.
- **Luồng dữ liệu:**
  ```
  withEngine(fn)
  ├── tạo BrowserEngine (key từ env nếu không truyền)
  ├── try: fn(engine)
  └── finally: engine.quit()
  ```
- **Cách dùng:**
  ```ts
  await withEngine(async (engine) => {
    const context = await engine.launch().newContext();
    // ... test ...
  });
  ```

### Mock constants

```ts
MOCK_FINGERPRINT_OPTIONS: FingerprintOptions = {
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

MOCK_PROXY_OPTIONS: ProxyOptions = {
  changeBrowserLanguage: false,
  changeGeolocation: false,
  changeTimezone: false,
  changeWebRTC: 'disable',
  enableTunneling: false,
  enableQUIC: false,
  dnsMode: 'system-proxy',
};

MOCK_PROFILE_OPTIONS: ProfileOptions = {
  loadProxy: false,
  loadFingerprint: false,
};
```

Tất cả mock đều set về `false` hoặc `disable` để test không phụ thuộc vào engine thật.

## Components

- `tests/helpers.ts` (tạo mới) — chứa toàn bộ utility.

Không sửa file nào khác.

## Xử lý lỗi

| Lỗi | Cách xử lý |
|-----|------------|
| `BABLOSOFT_KEY` trống khi gọi `createEngine()`/`withEngine()` | Ném `MissingKeyError` với message hướng dẫn set biến môi trường. |
| `skipTestIfNoKey()` gọi ngoài Mocha context | Vẫn trả về `true/false` đúng, nhưng log cảnh báo nếu `this` không phải Mocha context. |
| `engine.quit()` throw lỗi trong `withEngine()` | `finally` vẫn chạy, lỗi từ `quit()` bị nuốt để không che mất lỗi từ callback. |

## Kiểm tra (Testing)

Việc kiểm tra helpers này sẽ được thực hiện trong `tests/unit/core.spec.ts` (Unit Tests Core).

- **Happy path:** `skipTestIfNoKey()` trả về `false` khi có key.
- **Edge case:** `skipTestIfNoKey()` trả về `true` khi không có key.
- **Edge case:** `createEngine()` ném `MissingKeyError` khi thiếu key.
- **Error case:** `createEngine()` dùng key từ env khi không truyền tham số.
