# Product: Smoke Test E2E cho BrowserEngine

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả (cho developer)

Bộ smoke test E2E tại `tests/smoke/browser-engine.spec.ts` kiểm tra luồng chính của `BrowserEngine` -- class API chính của dự án. Các test này launch browser thật (Chromium) qua Playwright, đảm bảo lifecycle `launch() -> newContext() -> quit()` hoạt động đúng, fluent API chain config được, và lỗi được xử lý đúng chỗ.

## Yêu cầu hệ thống

- **playwright-core** >= 1.49 (peer dependency, đã có trong project).
- **Chromium** cài qua `npx playwright install chromium`.
- **BABLOSOFT_KEY** nếu muốn chạy test thật (thiếu key thì test tự động skip).
- **Node.js** >= 18, **OS:** Windows.

## Cách viết smoke test mới

### Pattern cơ bản

```ts
import { describe, it } from 'mocha';
import assert from 'node:assert';
import {
  skipTestIfNoKey,  // Kiểm tra key, skip nếu thiếu
  withEngine,        // Tự động tạo engine + quit sau test
  createEngine,      // Tạo engine thủ công
} from '../helpers';

describe('Nhóm test cần key', function () {
  if (skipTestIfNoKey()) return;       // <-- bắt buộc
  this.timeout(60000);                  // <-- 60s cho E2E

  it('test dùng lifecycle tự động', async () => {
    await withEngine(async (engine) => {
      engine.launch();
      const ctx = await engine.newContext();
      // ... test với ctx ...
    }); // withEngine tự động quit()
  });

  it('test cần kiểm soát lifecycle', async () => {
    const engine = createEngine();
    try {
      engine.launch();
      // ... test lỗi hoặc edge case ...
    } finally {
      await engine.quit();  // Bắt buộc cleanup
    }
  });
});
```

### Các mock constants có sẵn

| Constant | Type | Dùng cho |
|----------|------|----------|
| `MOCK_FINGERPRINT_DATA` | `string` | `useFingerprint(data)` |
| `MOCK_FINGERPRINT_OPTIONS` | `FingerprintOptions` | `useFingerprint(data, options)` |
| `MOCK_PROXY_OPTIONS` | `ProxyOptions` | `useProxy(data, options)` |
| `MOCK_PROFILE_OPTIONS` | `ProfileOptions` | `useProfile(dirPath, options)` |

## Cấu trúc test hiện tại

```
tests/smoke/browser-engine.spec.ts
├── Smoke: BrowserEngine (skip nếu thiếu key, timeout 60s)
│   ├── Minimal Flow
│   │   ├── launch -> newContext -> quit
│   │   └── withEngine wrapper cleanup
│   ├── Fluent API
│   │   └── useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit
│   ├── Error Handling
│   │   ├── newContext trước launch throw PluginError
│   │   ├── launch hai lần throw PluginError
│   │   ├── newContext khi context đã tồn tại throw PluginError
│   │   └── quit khi chưa launch không throw
│   └── newFingerprint
│       └── gọi API trả về JSON string hợp lệ
```

## Hành vi chi tiết

- `skipTestIfNoKey()` trả về `true` nếu thiếu `BABLOSOFT_KEY` -- dùng ở đầu `describe` block với `function` keyword.
- `withEngine(fn)` tạo engine, gọi `fn(engine)`, tự động `quit()` trong `finally` -- không gọi `launch()`.
- `createEngine(key?, launcher?)` tạo engine với key từ tham số hoặc env -- dùng riêng cho error test cần kiểm soát lifecycle.
- MoCA timeout mặc định 30s, smoke test ghi đè lên 60s do launch browser lần đầu chậm.

## Xử lý lỗi thường gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Test skip hết | Thiếu `BABLOSOFT_KEY` | Set env: `$env:BABLOSOFT_KEY = "your-key"` |
| Browser không launch | Thiếu Chromium binary | Chạy `npx playwright install chromium` |
| `newContext()` throw | Quên gọi `launch()` trước | Gọi `engine.launch()` trước `engine.newContext()` |
| Process treo sau test | Quên `engine.quit()` | Dùng `withEngine` để tự động cleanup |
| `PluginError` không match | Sai message lỗi | Xem `fluent.ts` để biết message chính xác |

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/test-smoke-engine.spec.md`
- Design: `docs/designs/test-smoke-engine.design.md`
- Plan: `docs/plans/test-smoke-engine.plan.md`
- Helpers: `tests/helpers.ts`
- Theo dõi tiến độ: [`TRACKING.md`](../TRACKING.md)
