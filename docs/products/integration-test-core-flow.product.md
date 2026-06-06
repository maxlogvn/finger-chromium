# Product: Integration Tests cho Core Flow

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả (cho người dùng)

Integration tests cho phép kiểm tra luồng chính `launch -> newContext -> quit` của `BrowserEngine` mà không cần engine thật (`FastExecuteScript.exe`), không cần `BABLOSOFT_KEY`, và không cần Playwright browser binary.

Test dùng `MockConnector` giả lập response từ engine API, và mock launcher trả về mock `BrowserContext`. Nhờ đó test chạy trong ~180ms thay vì ~60 giây như smoke tests.

## Yêu cầu hệ thống

- **Mocha** >= 11.x (dev dependency)
- **tsx** >= 4.x (dùng để chạy test files ESM)
- **Node.js** >= 18
- Không cần `BABLOSOFT_KEY`, không cần engine binary, không cần Playwright browsers

## Cách sử dụng (từng bước)

### Chạy integration test

```bash
# Chạy riêng integration test
npx mocha tests/integration/core-flow.spec.ts --exit

# Chạy toàn bộ test suite (bao gồm integration)
npm test
```

### Viết integration test mới

Sử dụng `MockConnector` và `createMockLauncher` từ `tests/integration/helpers.ts`:

```ts
import { MockConnector, createMockLauncher } from './helpers';
import { BrowserEngine } from '../../src/adapter/playwright/fluent';

it('test core flow with mock', async () => {
  const mockConnector = new MockConnector();
  const mockLauncher = createMockLauncher();
  const engine = new BrowserEngine(mockLauncher, mockConnector);

  engine.launch();
  const ctx = await engine.newContext();
  // ... assert ...
  await engine.quit();
});
```

### Tuỳ chỉnh response setup

```ts
const mockConnector = new MockConnector();
mockConnector.setupResponse = {
  id: 'custom-id',
  pid: '12345',
  pwd: '/custom/pwd',
  path: '/custom/browser',
  bounds: { width: 1024, height: 768 },
};
```

## Hành vi chi tiết

- `MockConnector.api('setup')` trả về response mặc định với các field `id`, `pid`, `pwd`, `path`, `bounds` hợp lệ.
- `MockConnector.api('fetch')` trả về `'{}'` (JSON string rỗng).
- `MockConnector.api('versions')` trả về `['default']`.
- Các method `cleanup()`, `setCwd()`, `setRequestTimeout()`, `setEngineTimeout()` là no-op.
- Mock launcher trả về mock `BrowserContext` có `once()`, `pages()`, `close()`, `newPage()`.
- `createMockLauncher()` tạo launcher với `launch` và `launchPersistentContext` đều trả về cùng một mock context instance.

## Giới hạn và điều kiện

- Chỉ test happy path -- không test lỗi từ engine API (timeout, invalid response).
- Mock context không hỗ trợ đầy đủ API của Playwright `BrowserContext` thật -- chỉ đủ để luồng `configure` chạy qua.
- Nếu `_launch()` trong `FingerprintPlugin` thay đổi logic gọi API setup, test cần cập nhật mock response tương ứng.

## Xử lý lỗi thường gặp (FAQ / Troubleshooting)

| Vấn đề | Nguyên nhân thường gặp | Giải pháp |
|--------|------------------------|------------|
| Test fail với `TypeError: Cannot create proxy with a non-object` | Mock context thiếu method `newPage` | Thêm `newPage: async () => ({})` vào mock context object. |
| `MockConnector` thiếu method | `FingerprintPlugin` gọi method mới trên connector | Thêm method tương ứng vào `MockConnector` class. |
| Integration test mất nhiều thời gian | Smoke tests đang chạy kèm vì `spec: tests/**/*.ts` | Chạy riêng file với `npx mocha tests/integration/ --exit`. |

## Tài liệu kỹ thuật liên quan (cho developer nâng cao)

- Issue: `docs/issues/integration-test-coverage.md`
- Design: `docs/designs/integration-test-coverage.design.md`
- Plan: `docs/plans/integration-test-core-flow.plan.md`
- Theo dõi tiến độ: [`TRACKING.md`](../TRACKING.md)
