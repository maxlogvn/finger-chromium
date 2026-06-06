# Design: Integration Tests cho Core Flow

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06
> **Người viết:** AI Agent | **Người phản biện:** ...

## Bối cảnh

Hiện tại toàn bộ core flow (launch -> newContext -> quit) chỉ được test bởi smoke tests, cần engine thật (download binary, spawn process, file I/O) và chạy ~60 giây. Unit tests (30 tests) chỉ test module phụ (errors, exports, config).

Cần integration test chạy nhanh (~1-2 giây), không cần engine thật, nhưng vẫn kiểm tra được sự phối hợp giữa các module trong core flow:

- `BrowserEngine.launch()` -> gọi connector API setup -> cấu hình engine
- `BrowserEngine.newContext()` -> launch persistent context với fingerprint
- `BrowserEngine.quit()` -> close context, cleanup engine, cleaner, mutex

## Câu hỏi làm rõ

1. **Câu hỏi:** Integration test ở tầng nào?
   - **Trả lời:** BrowserEngine (fluent.ts) -- launch -> newContext -> quit.
2. **Câu hỏi:** Có launch browser thật không?
   - **Trả lời:** Không. Smoke test đã lo phần đó. Mock cả connector lẫn launcher.
3. **Câu hỏi:** Có cần test error cases không?
   - **Trả lời:** Chỉ happy path (launch thành cong -> newContext -> quit).

## Các phương án

### Phương án 1: Connector DI (Được chọn)

Thêm tham số `connector?: Connector` vào constructor của `FingerprintPlugin`, chain qua `PlaywrightFingerprintPlugin` và `BrowserEngine`. Tạo `MockConnector` trả response giả cho `api('setup')`.

- **Ưu điểm:** Clean DI pattern, production code được cải thiện, dễ mở rộng.
- **Nhược điểm:** Sửa 3 file production.
- **Rủi ro:** Thấp -- chỉ thêm optional param, không ảnh hưởng code hiện tại.

### Phương án 2: Subclass + Protected factory method

Thêm `protected createConnector()` trong `FingerprintPlugin`, override trong test subclass.

- **Ưu điểm:** Chỉ sửa 1 file production.
- **Nhược điểm:** Test cần tạo subclass riêng, gián tiếp.

## Đánh giá so sánh

| Tiêu chí | Phương án 1 (DI) | Phương án 2 (Subclass) |
|----------|------------------|------------------------|
| Số file production sửa | 3 | 1 |
| Độ rõ ràng | Cao | Trung bình |
| Dễ mở rộng test scenario | Cao | Trung bình |
| Phù hợp với convention | Cao (DI pattern) | Trung bình |

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (Connector DI).
- **Phương án được chọn (sau review):** Phương án 1 (Connector DI) -- đã duyệt.
- **Lý do:** DI pattern rõ ràng, dùng được cho nhiều test scenario, không hack.

## Kiến trúc

### Thay đổi production code

**FingerprintPlugin** (`src/plugin/index.ts`):
- Constructor thêm `connector?: Connector`:
  ```ts
  constructor(launcherInstance?: ..., connector?: Connector) {
    this.#connector = connector ?? new Connector();
    // ... giữ nguyên
  }
  ```

**PlaywrightFingerprintPlugin** (`src/adapter/playwright/bridge.ts`):
- Constructor thêm `connector?: Connector`, pass qua `super()`:
  ```ts
  constructor(launcher?: Launcher, connector?: Connector) {
    super(undefined, connector);
    // ... giữ nguyên
  }
  ```

**BrowserEngine** (`src/adapter/playwright/fluent.ts`):
- Constructor thêm `connector?: Connector`, pass khi tạo engine:
  ```ts
  constructor(launcher?: Launcher, connector?: Connector) {
    this.engine = new PlaywrightFingerprintPlugin(launcher, connector);
    // ... giữ nguyên
  }
  ```

### Mock components

**MockConnector** (tests/integration/helpers.ts):
```ts
class MockConnector {
  setupResponse = {
    id: 'test-id',
    pid: '99999',
    pwd: '/tmp/mock/pwd',
    path: '/mock/browser',
    bounds: { width: 1280, height: 720 },
  };

  async api(name: string, _params: Record<string, unknown> = {}): Promise<unknown> {
    if (name === 'setup') return this.setupResponse;
    if (name === 'fetch') return '{}';
    if (name === 'versions') return ['default'];
    return {};
  }

  get requestTimeout(): number { return 30000; }
  cleanup(): void {}
  setCwd(_value: string): void {}
  setRequestTimeout(_value: number): void {}
  setEngineTimeout(_value: number): void {}
}
```

**MockBrowserContext** (tests/integration/helpers.ts):
```ts
function createMockContext() {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    once(event: string, handler: () => void) {
      (handlers[event] ??= []).push(handler);
    },
    pages: () => [],
    close: async () => { handlers['close']?.forEach(h => h()); },
  };
}
```

**MockLauncher** (tests/integration/helpers.ts):
```ts
function createMockLauncher() {
  const mockContext = createMockContext();
  return {
    launch: async () => mockContext,
    launchPersistentContext: async () => mockContext,
  };
}
```

### File structure

```
tests/
├── integration/
│   ├── helpers.ts          ← MockConnector, createMockContext, createMockLauncher
│   └── core-flow.spec.ts   ← integration test
├── helpers.ts              ← helpers hiện tại (skipTestIfNoKey, createEngine, withEngine)
├── smoke/ ...
└── unit/ ...
```

### Test cases

**core-flow.spec.ts:**
1. `launch -> newContext -> quit` -- happy path, verify không throw
2. `quit khi chưa launch` -- không throw (tương tự smoke test)

## Luồng dữ liệu

```
BrowserEngine.launch()
  -> engine.setServiceKey(key)
  -> engine.setWorkingFolder(dir)    -> MockConnector.setCwd() (no-op)
  -> engine.useProfile(...)
  -> this.isLaunched = true

BrowserEngine.newContext()
  -> engine.launchPersistentContext(dir, opts)
    -> PlaywrightFingerprintPlugin.launchPersistentContext()
      -> _launch(false, { launcher, ... })
        -> connector.api('setup', {...})   -> MockConnector trả response giả
        -> cleaner.watch(pwd)               -> pwd từ response
        -> mutex.create(pid)                -> pid từ response
        -> launcher.launch(launchOpts)       -> MockLauncher trả mockContext
        -> configure(cleanup, browser, bounds, sync)
          -> onClose(context, cleanup)
          -> bindHooks(context, { onPageCreated })
      -> return browser (mockContext)
  -> this.context = context

BrowserEngine.quit()
  -> context.close()          -> mockContext.close() (no-op)
  -> engine.cleanup()
    -> browser.close()        -> mockContext.close()
    -> connector.cleanup()    -> MockConnector.cleanup() (no-op)
    -> mutex.release(pid)
    -> cleaner.stop()
  -> dataManager.dispose()
```

## Xử lý lỗi

| Tình huống | Cách xử lý | Kết quả mong đợi |
|------------|------------|------------------|
| `api('setup')` lỗi | Không test (ngoài scope) | N/A |
| Mock response thiếu field | Throw PluginError rõ ràng | Test fail rõ ràng |
| MockLauncher.launch() lỗi | Không setup (chỉ happy path) | N/A |

## Kiểm thử

```bash
# Chạy integration test
npx mocha tests/integration/core-flow.spec.ts

# Chạy toàn bộ test
npm test
```

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|-----------|
| `FingerprintPlugin._launch()` thay đổi theo thời gian | Trung bình | Test chỉ test hành vi bên ngoài (launch/newContext/quit), không test internal |
| Private field `#connector` cần DI | Thấp | Optional param = không breaking change |
| Mock không khớp với response thật (thiếu field) | Cao | Dựa vào type `SetupResponse` để đảm bảo response mock đúng field |
