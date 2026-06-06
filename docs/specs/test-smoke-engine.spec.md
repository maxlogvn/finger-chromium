# Spec: Smoke Test E2E cho BrowserEngine

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).
> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả

Tạo file `tests/smoke/browser-engine.spec.ts` chứa smoke test E2E cho `BrowserEngine` (Fluent API). Test lifecycle chính: launch, newContext, quit; fluent config chain (fingerprint, proxy, profile); xử lý lỗi khi gọi sai thứ tự.

## Phạm vi

- **Trong phạm vi:**
  - Minimal lifecycle: launch -> newContext -> quit.
  - Full fluent API chain: useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit.
  - Error handling: gọi newContext trước launch, launch hai lần, newContext khi đã có context, quit khi chưa launch.
  - `newFingerprint()` gọi API thật, verify trả về JSON string.
  - Skip toàn bộ describe block nếu thiếu `BABLOSOFT_KEY`.
  - Dùng `createEngine` / `withEngine` từ `tests/helpers.ts`.
  - Dùng mock constants từ helpers cho option types.
  - Thêm `MOCK_FINGERPRINT_DATA` (JSON string) vào `tests/helpers.ts`.

- **Ngoài phạm vi:**
  - Test `repackChromium()` -- method nâng cao.
  - Test fingerprint inject hiệu quả (CDP verify) -- là nhiệm vụ của integration test riêng.
  - Test proxy thật (kết nối proxy server) -- là nhiệm vụ của integration test riêng.
  - Test profile thật (load/save profile) -- là nhiệm vụ của integration test riêng.
  - Performance test hay stress test.

## Yêu cầu

- **Functional:**
  - Smoke test phải launch được browser thật (Chromium qua playwright-core).
  - Smoke test phải tạo được `BrowserContext` thành công.
  - Smoke test phải gọi `quit()` dọn dẹp sạch (không treo process).
  - Error cases phải throw `PluginError` đúng lúc.
  - `newFingerprint()` phải trả về JSON string hợp lệ (parse được).
  - Nếu thiếu `BABLOSOFT_KEY`, toàn bộ describe block bị skip, không fail.

- **Non-functional:**
  - Timeout mỗi test là 60s (gấp đôi mặc định 30s) do launch browser lần đầu có thể chậm.
  - Dùng `function` keyword (không arrow) cho describe block có skipTestIfNoKey.
  - Nuốt lỗi từ `quit()` trong `withEngine` để không che mất lỗi chính.

## Phụ thuộc

- `tests/helpers.ts` -- `createEngine`, `withEngine`, `skipTestIfNoKey`, mock constants.
- `playwright-core` -- browser thật (chromium), phải được cài qua `npx playwright install chromium`.
- `BABLOSOFT_KEY` -- biến môi trường, nếu thiếu thì skip test.
- `src/adapter/playwright/fluent.ts` -- `BrowserEngine` class, `PluginLaunchOptions`, `Launcher` type.

## Thiết kế

Tham chiếu: `docs/designs/test-smoke-engine.design.md`

Cấu trúc file:
```
tests/smoke/browser-engine.spec.ts
├── describe('Smoke: BrowserEngine') [function keyword, skipTestIfNoKey]
│   ├── describe('Minimal Flow')
│   │   ├── it('launch -> newContext -> quit')
│   │   └── it('withEngine wrapper')
│   ├── describe('Fluent API')
│   │   └── it('useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit')
│   ├── describe('Error Handling')
│   │   ├── it('newContext trước launch')
│   │   ├── it('launch hai lần')
│   │   ├── it('newContext khi đã có context')
│   │   └── it('quit khi chưa launch')
│   └── describe('newFingerprint')
│       └── it('gọi API trả về JSON string')
```

## API / Data flow

### Test data

- **Fingerprint data (thêm vào helpers.ts):**
  ```ts
  export const MOCK_FINGERPRINT_DATA = '{}';
  ```
  JSON string tối thiểu. Vì `MOCK_FINGERPRINT_OPTIONS` tất cả đều `false`, engine không xử lý data này.

- **Proxy URL:**
  Dùng string bất kỳ, ví dụ `'http://localhost:8080'`. Vì `MOCK_PROXY_OPTIONS` có `enableTunneling: false`, proxy không thực sự kết nối.

- **Profile path:**
  Dùng đường dẫn temp directory (tạo bằng `fs.mkdtempSync`). Vì `MOCK_PROFILE_OPTIONS` có `loadProxy: false, loadFingerprint: false`, profile không thực sự load dữ liệu.

### Flow từng test

#### Minimal Flow

```ts
// Pattern: withEngine
await withEngine(async (engine) => {
  engine.launch();
  const ctx = await engine.newContext();
  assert.ok(ctx);
  assert.strictEqual(typeof ctx.newPage, 'function');
});
```

#### Full Fluent API Flow

```ts
// Pattern: withEngine
await withEngine(async (engine) => {
  engine
    .useFingerprint(MOCK_FINGERPRINT_DATA, MOCK_FINGERPRINT_OPTIONS)
    .useProxy('http://localhost:8080', MOCK_PROXY_OPTIONS)
    .useProfile(tmpProfileDir, MOCK_PROFILE_OPTIONS)
    .launch();

  const ctx = await engine.newContext();
  assert.ok(ctx);
  assert.strictEqual(typeof ctx.close, 'function');
});
```

#### Error Handling

```ts
// Pattern: createEngine + try/finally
const engine = createEngine();
try {
  // Test 1: newContext trước launch
  await assert.rejects(
    () => engine.newContext(),
    PluginError
  );

  // Test 2: launch hai lần
  engine.launch();
  assert.throws(
    () => engine.launch(),
    PluginError
  );

  // Test 3: newContext khi đã có context
  const ctx = await engine.newContext();
  await assert.rejects(
    () => engine.newContext(),
    PluginError
  );
} finally {
  await engine.quit();
}
```

```ts
// Test 4: quit khi chưa launch (dùng engine riêng chưa launch)
const engine2 = createEngine();
await engine2.quit();  // Không throw
```

#### newFingerprint

```ts
// Pattern: withEngine
await withEngine(async (engine) => {
  const fp = await engine.newFingerprint({ tags: ['Chrome', 'Windows 10'] });
  assert.ok(typeof fp === 'string');
  const parsed = JSON.parse(fp);
  assert.ok(parsed !== null && typeof parsed === 'object');
});
```

## Components

- `tests/smoke/browser-engine.spec.ts` (tạo mới) -- file smoke test chính.
- `tests/helpers.ts` (sửa) -- thêm `MOCK_FINGERPRINT_DATA` constant.

## Xử lý lỗi

| Tình huống | Cách xử lý |
|------------|------------|
| `newContext()` trước `launch()` | Throw `PluginError` với message "[BrowserEngine] Phai goi launch() truoc khi tao context." |
| `launch()` khi đã launch | Throw `PluginError` với message "[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan." |
| `newContext()` khi context đã tồn tại | Throw `PluginError` với message "[BrowserEngine] Context da duoc tao. Vui long goi quit() truoc khi tao moi." |
| `quit()` khi chưa launch | No-op (không throw, không crash). Kiểm tra bằng cách gọi và xác nhận không có lỗi. |
| Thiếu `BABLOSOFT_KEY` | `skipTestIfNoKey()` trả về `true` --> `return` ở đầu describe block --> Mocha báo skipped, không fail. |

## Kiểm tra (Testing)

Đây là spec cho test -- bản thân nó là file test. Verification:

- Chạy `npm test` với `BABLOSOFT_KEY` set --> cả 8 test pass.
- Chạy `npm test` không có `BABLOSOFT_KEY` --> tất cả test skipped.
- Chạy `npm run lint` && `npm run typecheck` -- không lỗi.
- Chạy `npm run build` -- bundle thành công.
