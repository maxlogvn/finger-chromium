# Product: Test Utilities (`tests/helpers.ts`)

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả (cho người dùng)

File `tests/helpers.ts` cung cấp các hàm và hằng số dùng chung cho toàn bộ test trong dự án. Giúp viết test ngắn gọn, nhất quán, tránh boilerplate trùng lặp như kiểm tra `BABLOSOFT_KEY`, tạo/huỷ `BrowserEngine`, và mock data cho options.

## Yêu cầu hệ thống

- **Mocha** >= 11.x (dev dependency)
- **tsx** >= 4.x (dùng để chạy test files ESM)
- **Node.js** >= 18

## Cách sử dụng (từng bước)

### 1. `skipTestIfNoKey()`

Dùng ở đầu `describe()` hoặc `it()` để bỏ qua test khi thiếu `BABLOSOFT_KEY`:

```ts
describe('cần engine thật', function () {
  if (skipTestIfNoKey()) return;

  it('test nào đó', async () => {
    // ...
  });
});
```

**Lưu ý:** Phải dùng `function` keyword (không phải arrow function) vì Mocha context chỉ hoạt động với function truyền thống.

### 2. `createEngine(key?, launcher?)`

Tạo `BrowserEngine` instance mới:

```ts
// Dùng key từ BABLOSOFT_KEY env
const engine = createEngine();

// Hoặc truyền key trực tiếp
const engine = createEngine('my-key');

// Hoặc với Playwright launcher tuỳ chỉnh
const engine = createEngine('my-key', customLauncher);

await engine.launch().newContext();
// ... test ...
await engine.quit();
```

### 3. `withEngine(fn, key?, launcher?)`

Tự động quản lý lifecycle của `BrowserEngine`:

```ts
await withEngine(async (engine) => {
  const ctx = await engine.launch().newContext();
  const page = await ctx.newPage();
  await page.goto('https://example.com');
  // engine.quit() được gọi tự động trong finally
});
```

### 4. Mock constants

Dùng trong unit test không cần engine thật:

```ts
import { MOCK_FINGERPRINT_OPTIONS } from '../helpers';

it('dùng mock options', () => {
  const result = someFunction(MOCK_FINGERPRINT_OPTIONS);
  assert.strictEqual(result, expected);
});
```

## Hành vi chi tiết

- `skipTestIfNoKey()` log warning `console.warn` khi skip, giúp developer biết lý do test bị bỏ qua.
- `createEngine()` dùng key từ tham số nếu được truyền, fallback về `process.env.BABLOSOFT_KEY`.
- `createEngine()` ném `MissingKeyError` nếu không có key -- message hướng dẫn set biến môi trường.
- `withEngine()` nuốt lỗi từ `engine.quit()` để không che mất lỗi từ callback.
- Mock constants set tất cả về `false`/`disable` để test không phụ thuộc vào engine thật.

## Giới hạn và điều kiện

- `skipTestIfNoKey()` chỉ hoạt động trong Mocha context (`function` keyword).
- `createEngine()` không thể set key nếu `BABLOSOFT_KEY` đã được import từ fluent.ts trước đó (do `PRIVATE_KEY` là module-level constant).
- Mock constants không phải dữ liệu fingerprint thật -- chỉ hợp lệ về type.

## Xử lý lỗi thường gặp (FAQ / Troubleshooting)

| Vấn đề | Nguyên nhân thường gặp | Giải pháp |
|--------|------------------------|------------|
| `MissingKeyError` | `BABLOSOFT_KEY` chưa được set | Chạy `$env:BABLOSOFT_KEY = "your-key"` trước khi test. |
| `skipTestIfNoKey()` không skip | Gọi sau `it()` hoặc trong `before()` | Gọi ở đầu `describe()` hoặc `it()` block. |
| Engine không quit sau test | Quên dùng `withEngine()` hoặc `try/finally` | Dùng `withEngine()` để đảm bảo cleanup. |

## Tài liệu kỹ thuật liên quan (cho developer nâng cao)

- Spec: `docs/specs/test-helpers.spec.md`
- Design: `docs/designs/test-helpers.design.md`
- Plan: `docs/plans/test-helpers.plan.md`
- Issue: `docs/issues/test-helpers.md`
- Theo dõi tiến độ: [`TRACKING.md`](../TRACKING.md)
