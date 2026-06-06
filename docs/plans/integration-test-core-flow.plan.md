# Plan: Integration Tests cho Core Flow

> **Version:** 1.0 | **Ngày bắt đầu dự kiến:** 2026-06-06 | **Ngày kết thúc dự kiến:** 2026-06-06

## File structure

```
Sửa:
  src/plugin/index.ts                     -- thêm tham số connector
  src/adapter/playwright/bridge.ts        -- pass connector qua super()
  src/adapter/playwright/fluent.ts        -- pass connector tới engine
  docs/TRACKING.md                        -- cập nhật bước hiện tại

Tạo mới:
  tests/integration/helpers.ts            -- MockConnector + helpers
  tests/integration/core-flow.spec.ts     -- integration test
```

## Các bước thực hiện

### Bước 1: Sửa `FingerprintPlugin` — thêm tham số `connector`

**Sửa:** `src/plugin/index.ts` — dòng 78, 87-90

Thay field declaration và constructor để nhận connector tùy chọn:

```ts
// Dòng 78 — giữ nguyên field, chỉ thay initial value trong constructor
#connector!: Connector;

// Dòng 87-90 — constructor nhận thêm tham số connector
constructor(
    launcherInstance?: { launch: (opts: BaseLaunchOptions) => Promise<Browser> },
    connector?: Connector
) {
    this.#connector = connector ?? new Connector();
    this.launcher =
        launcherInstance ?? ({ launch } as unknown as { launch: (opts: BaseLaunchOptions) => Promise<Browser> });
}
```

**DoD:** `npm run typecheck` pass, `npm run lint` pass.

---

### Bước 2: Sửa `PlaywrightFingerprintPlugin` — pass connector qua super()

**Sửa:** `src/adapter/playwright/bridge.ts` — dòng 57-61

```ts
constructor(launcher?: Launcher, connector?: Connector) {
    super(undefined, connector);
    this.pwLauncher = launcher ?? createDefaultLauncher();
}
```

Thêm import `Connector`:
```ts
import Connector from '../../plugin/connector';
```

**DoD:** `npm run typecheck` pass.

---

### Bước 3: Sửa `BrowserEngine` — pass connector khi tạo engine

**Sửa:** `src/adapter/playwright/fluent.ts` — dòng 81-88

```ts
constructor(launcher?: Launcher, connector?: Connector) {
    this.engine = new PlaywrightFingerprintPlugin(launcher, connector);
    this.options = { ...DEFAULT_CONTEXT_OPTIONS };
    this.privateKey = PRIVATE_KEY;
    this.engineWorkingDirPath = ENGINE_WORKING_DIR;
    this.dataManager = new AdapterDataManager();
    this.profileData = [path.join(BROWSER_RUNNING_DIR, 'profile')];
}
```

Thêm import:
```ts
import Connector from '../../plugin/connector';
```

**DoD:** `npm run typecheck` pass.

---

### Bước 4: Chạy typecheck + lint để xác nhận DI không gây lỗi

Chạy:
```bash
npm run typecheck
npm run lint
```

**Kỳ vọng:** Cả hai pass, không lỗi.

---

### Bước 5: Tạo `tests/integration/helpers.ts` — MockConnector + mock helpers

**Tạo:** `tests/integration/helpers.ts`

```ts
// ─── File: tests/integration/helpers.ts ──────────────────────────────────
// Mock helpers cho integration test -- giả lập Connector, BrowserContext, Launcher.
// Không cần BABLOSOFT_KEY, không cần engine binary, không cần Playwright browser.
// ─────────────────────────────────────────────────────────────────────────────

import Connector from '../../src/plugin/connector';

// ─── Mock Connector ──────────────────────────────────────────────────────────

export interface MockSetupResponse {
    id: string;
    pid: string;
    pwd: string;
    path: string;
    bounds: { width: number; height: number };
    [key: string]: unknown;
}

export const DEFAULT_SETUP_RESPONSE: MockSetupResponse = {
    id: 'mock-id-123',
    pid: '99999',
    pwd: '/tmp/mock/pwd',
    path: '/mock/browser/path',
    bounds: { width: 1280, height: 720 },
};

export class MockConnector {
    setupResponse = { ...DEFAULT_SETUP_RESPONSE };

    async api(name: string, _params: Record<string, unknown> = {}): Promise<unknown> {
        if (name === 'setup') return this.setupResponse;
        if (name === 'fetch') return '{}';
        if (name === 'versions') return ['default'];
        return {};
    }

    get requestTimeout(): number {
        return 30000;
    }

    async cleanup(): Promise<void> {
        // no-op
    }

    setCwd(_value: string): void {
        // no-op
    }

    setRequestTimeout(_value: number): void {
        // no-op
    }

    setEngineTimeout(_value: number): void {
        // no-op
    }
}

// ─── Mock BrowserContext ─────────────────────────────────────────────────────

export function createMockBrowserContext() {
    const handlers: Record<string, Array<() => void>> = {};

    return {
        once(event: string, handler: () => void) {
            (handlers[event] ??= []).push(handler);
        },
        pages: () => [],
        close: async () => {
            handlers['close']?.forEach((h) => h());
        },
    };
}

// ─── Mock Launcher ───────────────────────────────────────────────────────────

export function createMockLauncher() {
    const mockContext = createMockBrowserContext();

    return {
        launch: async () => mockContext,
        launchPersistentContext: async () => mockContext,
    };
}

// ─── Factory tạo engine với mock ─────────────────────────────────────────────

export function createMockEngine() {
    const mockConnector = new MockConnector();
    const mockLauncher = createMockLauncher();

    return {
        mockConnector,
        mockLauncher,
        mockContext: mockLauncher.launch as unknown as Awaited<ReturnType<typeof mockLauncher.launch>>,
    };
}
```

**DoD:** File tồn tại, `npm run typecheck` không báo lỗi import.

---

### Bước 6: Tạo `tests/integration/core-flow.spec.ts` — integration test

**Tạo:** `tests/integration/core-flow.spec.ts`

```ts
import assert from 'node:assert';
import { BrowserEngine } from '../../src/adapter/playwright/fluent';
import { MockConnector, createMockLauncher, DEFAULT_SETUP_RESPONSE } from './helpers';

describe('Integration: Core Flow', function () {
    it('launch -> newContext -> quit with mock connector', async () => {
        const mockConnector = new MockConnector();
        const mockLauncher = createMockLauncher();
        const engine = new BrowserEngine(mockLauncher, mockConnector);

        // --- Launch ---
        engine.launch();

        // --- New Context ---
        const ctx = await engine.newContext();
        assert.ok(ctx, 'context should be returned');
        assert.strictEqual(typeof ctx.close, 'function', 'context should have close method');

        // --- Quit ---
        await engine.quit();
    });

    it('quit khi chua launch không throw', async () => {
        const engine = new BrowserEngine();

        let thrown = false;
        try {
            await engine.quit();
        } catch {
            thrown = true;
        }

        assert.strictEqual(thrown, false, 'quit should not throw when not launched');
    });
});
```

**DoD:** File tồn tại.

---

### Bước 7: Chạy integration test

Chạy:
```bash
npx mocha tests/integration/core-flow.spec.ts --exit
```

**Kỳ vọng:** 2 tests pass, không throw, không timeout.

Nếu fail, sửa lỗi và chạy lại.

---

### Bước 8: Kiểm tra typecheck + lint + test

```bash
npm run typecheck
npm run lint
npm test
```

**Kỳ vọng:**
- `typecheck`: pass
- `lint`: pass
- `test`: tất cả test pass (cả cũ và mới)

---

### Bước 9: Cập nhật TRACKING.md

**Sửa:** `docs/TRACKING.md`

Chuyển mục "Viết Integration Tests cho Core Flow" từ "Làm rõ vấn đề" sang "Đã có Design + Plan, chờ code".

---

### Bước 10: Commit

```bash
git add src/plugin/index.ts src/adapter/playwright/bridge.ts src/adapter/playwright/fluent.ts
git add tests/integration/
git add docs/designs/integration-test-coverage.design.md docs/plans/integration-test-core-flow.plan.md
git add docs/TRACKING.md
git commit -m "feat: thêm connector DI cho integration test core flow
- Thêm optional connector param cho FingerprintPlugin, PlaywrightFingerprintPlugin, BrowserEngine
- Tạo MockConnector, mock launcher, mock context trong tests/integration/helpers.ts
- Viết integration test cho launch -> newContext -> quit
- Design và plan tại docs/"
```

## Kiểm tra tổng thể

- `npm run lint` — ESLint pass
- `npm run typecheck` — TypeScript type check pass
- `npm test` — toàn bộ test (cũ + mới) pass
- Integration test chạy không cần `BABLOSOFT_KEY`, không cần engine binary

## Rủi ro & phương án dự phòng

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|-----------|
| `#connector` private field không thể khởi tạo trong constructor | Thấp | Dùng `!` (definite assignment assertion) và khởi tạo trong constructor |
| `MockConnector` thiếu method mà `FingerprintPlugin` gọi | Thấp | Thêm method khi test fail với type error |
| Mocha timeout vì `_launch` gọi `cleaner.watch` cần I/O | Trung bình | Tăng timeout trong `describe()` nếu cần |

## Ghi chú bổ sung

- Không cần cập nhật `CONVENTIONS.md`, `STACK.md` hay `Welcome.md`.
- `BrowserEngine` constructor không cần sửa default value — tham số `connector` là optional.
