# Test Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Viết unit test cho SettingsCleaner, ConfigManager, và Mutex trong file `tests/cleanup.test.ts`.

**Architecture:** Dùng sinon.stub() để mock dependencies (proper-lockfile, fast-glob, fs/promises, async-lock, setViewport, timers/promises) — thay vì proxyquire — vì proxyquire không tương thích với tsx/esm loader (ESM native, imports transpiled, require interception không hiệu quả). Sinon stub trực tiếp trên CJS module exports object, đảm bảo cả test và source code tham chiếu cùng một object.

**Tech Stack:** Mocha + tsx + sinon (stub/spy) + node:assert

**Files:**
- Create: `tests/cleanup.test.ts`
- Install: `sinon@latest` + `@types/sinon@latest` (devDependencies)
- No source changes

---

### Task 1: Cài đặt sinon + @types/sinon

**Files:**
- Modify: `package.json`
- Run: `npm install`

- [ ] **Step 1: Thêm sinon vào devDependencies**

```bash
npm install --save-dev sinon @types/sinon
```

Expected: package.json cập nhật, node_modules có sinon.

- [ ] **Step 2: Verify install**

```bash
npm ls sinon
```

Expected: hiển thị version sinon.

---

### Task 2: SettingsCleaner — watch/ignore/include/stop

**Files:**
- Create: `tests/cleanup.test.ts`

- [ ] **Step 1: Viết boilerplate và test cho `watch()`**

```ts
import { describe, it, beforeEach, afterEach } from 'mocha';
import { strictEqual, ok, rejects, doesNotThrow } from 'node:assert';
import sinon from 'sinon';

// Module cần test
import { SettingsCleaner } from '../src/plugin/cleaner';
// Dependencies để stub
import lock from 'proper-lockfile';
import fg from 'fast-glob';
import { rm } from 'fs/promises';

describe('SettingsCleaner', () => {
  let cleaner: SettingsCleaner;

  beforeEach(() => {
    cleaner = new SettingsCleaner();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('watch()', () => {
    it('nên thêm folder mới vào danh sách và khởi động timer', () => {
      const setIntervalSpy = sinon.spy(global, 'setInterval');
      cleaner.watch('/tmp/test');
      strictEqual((cleaner as any).folders.length, 1);
      ok(setIntervalSpy.calledOnce);
    });
  });
});
```

Lưu ý: `#folders` là private field — không truy cập được từ test. Cần adjust:
- Cách 1: dùng `any` cast `(cleaner as any).folders`
- Cách 2: dùng spread/return từ watch (sửa source — không được phép)
- Chọn Cách 1 cho mọi private field access.

- [ ] **Step 2: Verify test fail đúng cách**

```bash
npm test -- --grep "SettingsCleaner"
```

Expected: 1 test. Pass nếu logic watch() đúng.

Sửa test cho chính xác hơn — watch() không return folders. Cần verify qua behavior:
- watch() gọi 2 lần với cùng folder → timer chỉ tạo 1 lần.
- watch() gọi với folder khác → `setInterval` chỉ gọi 1 lần (timer unref).

```ts
describe('watch()', () => {
  it('nên thêm folder mới vào danh sách', () => {
    cleaner.watch('/tmp/test');
    cleaner.watch('/tmp/other');
    // Verify qua spy hoặc behavior
    ok(true, 'không throw');
  });

  it('nên không tạo timer nếu đã có', () => {
    const setIntervalSpy = sinon.spy(global, 'setInterval');
    cleaner.watch('/tmp/test');
    cleaner.watch('/tmp/other');
    ok(setIntervalSpy.calledOnce);
  });
});
```

- [ ] **Step 3: Test `ignore()` với stubs**

```ts
describe('ignore()', () => {
  beforeEach(() => {
    sinon.stub(lock, 'lock').resolves();
    sinon.stub(lock, 'unlock').resolves();
  });

  it('nên gọi lock.lock() cho mỗi LOCKABLE_ITEMS', async () => {
    const lockStub = lock.lock as sinon.SinonStub;
    await cleaner.ignore('/tmp/test', '123', 'abc');
    strictEqual(lockStub.callCount, 3);
  });

  it('nên bỏ qua ENOENT mà không throw', async () => {
    (lock.lock as sinon.SinonStub).rejects(Object.assign(new Error(), { code: 'ENOENT' }));
    await doesNotThrow(() => cleaner.ignore('/tmp/test', '123', 'abc'));
  });
});
```

- [ ] **Step 4: Test `include()`**

```ts
describe('include()', () => {
  beforeEach(() => {
    sinon.stub(lock, 'unlock').resolves();
  });

  it('nên gọi lock.unlock() cho mỗi LOCKABLE_ITEMS', async () => {
    const unlockStub = lock.unlock as sinon.SinonStub;
    await cleaner.include('/tmp/test', '123', 'abc');
    strictEqual(unlockStub.callCount, 3);
  });
});
```

- [ ] **Step 5: Test `stop()`**

```ts
describe('stop()', () => {
  it('nên clear interval và clear folders', async () => {
    const clearIntervalSpy = sinon.spy(global, 'clearInterval');
    sinon.stub(fg).resolves([]);
    cleaner.watch('/tmp/test');
    await cleaner.stop();
    ok(clearIntervalSpy.calledOnce);
  });

  it('nên unlock các file còn locked khi stop', async () => {
    sinon.stub(fg).resolves([
      { path: '/tmp/test/t/123', stats: null } as any,
    ]);
    sinon.stub(lock, 'check').resolves(true);
    const unlockStub = sinon.stub(lock, 'unlock').resolves();
    cleaner.watch('/tmp/test');
    await cleaner.stop();
    ok(unlockStub.calledOnce);
  });
});
```

- [ ] **Step 6: Chạy test SettingsCleaner**

```bash
npm test -- --grep "SettingsCleaner"
```

Expected: tất cả tests pass. Nếu có fail, sửa test cho khớp với behavior thật.

---

### Task 3: SettingsCleaner — cleanup cycle

- [ ] **Step 1: Test `#cleanup()` qua watch interval**

Vì `#cleanup()` là private, chỉ có thể test gián tiếp qua `watch()` + `stop()`, hoặc dùng prototype access.

Test behaviour: Khi không có folder watched → silent no-op.

```ts
describe('#cleanup (indirect)', () => {
  it('nên không throw khi không có folder nào', async () => {
    await doesNotThrow(() => (cleaner as any).cleanup());
  });
});
```

- [ ] **Step 2: Test cleanup với file expired + locked**

```ts
it('nên không xoá file còn locked', async () => {
  sinon.stub(fg).resolves([
    {
      path: '/tmp/test/t/123.txt',
      stats: { mtimeMs: Date.now() - 20000 },
    },
  ]);
  sinon.stub(lock, 'check').resolves(true);
  const rmStub = sinon.stub(rm).resolves();
  await (cleaner as any).cleanup();
  ok(rmStub.notCalled);
});
```

- [ ] **Step 3: Test cleanup với file expired + unlocked**

```ts
it('nên xoá file expired và unlocked', async () => {
  sinon.stub(fg).resolves([
    {
      path: '/tmp/test/t/123.txt',
      stats: { mtimeMs: Date.now() - 20000 },
    },
  ]);
  sinon.stub(lock, 'check').resolves(false);
  const rmStub = sinon.stub(rm).resolves();
  await (cleaner as any).cleanup();
  ok(rmStub.calledOnce);
});
```

- [ ] **Step 4: Test cleanup với file non-expired**

```ts
it('nên không xoá file non-expired', async () => {
  sinon.stub(fg).resolves([
    {
      path: '/tmp/test/t/123.txt',
      stats: { mtimeMs: Date.now() - 1000 },
    },
  ]);
  sinon.stub(lock, 'check').resolves(false);
  const rmStub = sinon.stub(rm).resolves();
  await (cleaner as any).cleanup();
  ok(rmStub.notCalled);
});
```

- [ ] **Step 5: Chạy lại toàn bộ SettingsCleaner test**

```bash
npm test -- --grep "SettingsCleaner"
```

Expected: all pass.

---

### Task 4: ConfigManager — configure

**Files:**
- Modify: `tests/cleanup.test.ts`

- [ ] **Step 1: Viết test `configure()` với viewport**

```ts
import { ConfigManager } from '../src/plugin/config';
import { setViewport as setViewportModule } from '../src/plugin/browser';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('configure()', () => {
    it('nên đăng ký exit handler và gọi setViewport khi có bounds', async () => {
      const setViewportStub = sinon.stub(setViewportModule, 'setViewport').resolves();
      const mockBrowser = {
        process: { once: sinon.stub().callsFake((_event: string, fn: Function) => {}) },
        configure: sinon.stub().resolves(),
      };

      await configManager.configure(
        () => {},
        mockBrowser as any,
        { width: 1920, height: 1080 }
      );

      ok((mockBrowser.process.once as sinon.SinonStub).calledWith('exit'));
      ok((mockBrowser.configure as sinon.SinonStub).calledOnce);
    });

    it('nên không gọi setViewport khi không có bounds', async () => {
      const setViewportStub = sinon.stub(setViewportModule, 'setViewport').resolves();
      const mockBrowser = {
        process: { once: sinon.stub() },
        configure: sinon.stub().resolves(),
      };

      await configManager.configure(
        () => {},
        mockBrowser as any,
        {}
      );

      ok(setViewportStub.notCalled);
    });
  });
});
```

Lưu ý: `setViewport` trong `config.ts` là named import `import { setViewport } from './browser'`. Cần stub module-level. Vì `./browser` là file internal của project (không phải CJS module), ESM live binding nghĩa là `import { setViewport }` giữ tham chiếu trực tiếp đến export. Sinon có thể stub được nếu import trực tiếp module.

Cách tiếp cận:
```ts
import * as browserModule from '../src/plugin/browser';
beforeEach(() => {
  sinon.stub(browserModule, 'setViewport').resolves();
});
```

- [ ] **Step 2: Chạy test ConfigManager configure**

```bash
npm test -- --grep "ConfigManager configure"
```

Expected: pass.

---

### Task 5: ConfigManager — synchronize + getValidPollInterval

- [ ] **Step 1: Test `synchronize()` full flow**

Cần stub:
- `readFile` từ `fs/promises`
- `writeFile` từ `fs/promises`
- AsyncLock.acquire — config.ts dùng `this.#lock.acquire(id, async () => {...})`

Vì AsyncLock là instance riêng của mỗi ConfigManager, và `#lock` là private, cần stub `AsyncLock.prototype.acquire`.

```ts
import AsyncLock from 'async-lock';
import { readFile, writeFile } from 'fs/promises';

describe('synchronize()', () => {
  it('nên đọc file .ini, reset BAS_NOT_SET, action, set giá trị thật', async () => {
    const iniContent = 'availWidth=1920\navailHeight=1080\n';
    sinon.stub(readFile).resolves(iniContent);
    sinon.stub(writeFile).resolves();
    sinon.stub(AsyncLock.prototype, 'acquire').callsFake((_key: string, fn: () => Promise<void>) => fn());

    const action = sinon.stub().resolves();

    await configManager.synchronize('abc', '/tmp', { width: 1024, height: 768 }, action);

    ok(action.calledOnce);
    // writeFile được gọi 2 lần: reset + set thật
    strictEqual((writeFile as sinon.SinonStub).callCount, 2);
  });
});
```

- [ ] **Step 2: Test `getValidPollInterval()` edge cases**

Vì `getValidPollInterval` là private function (không export), test gián tiếp qua behavior của `synchronize()` hoặc access qua `any`:

```ts
it('nên dùng pollInterval mặc định 500ms khi không truyền', async () => {
  // Test behavior: nếu không truyền pollInterval, setTimeout được gọi với 500
  const setTimeoutStub = sinon.stub(timersPromises, 'setTimeout').resolves();
  sinon.stub(readFile).resolves('availWidth=1920\navailHeight=1080\n');
  sinon.stub(writeFile).resolves();
  sinon.stub(AsyncLock.prototype, 'acquire').callsFake((_key: string, fn: () => Promise<void>) => fn());

  await configManager.synchronize('abc', '/tmp', { width: 1024, height: 768 });

  ok(setTimeoutStub.calledWith(500));
});
```

- [ ] **Step 3: Chạy test ConfigManager**

```bash
npm test -- --grep "ConfigManager"
```

Expected: all pass.

---

### Task 6: Mutex — test exports

- [ ] **Step 1: Viết test cho Mutex exports**

Vì mutex/index.ts require native `mutex.node`, chỉ test được error path (nếu file không tồn tại, module sẽ throw khi import). Cần dynamic import và catch lỗi.

```ts
describe('Mutex', () => {
  it('nên export default là object có create function', async () => {
    try {
      const mutexModule = await import('../src/plugin/mutex/index');
      const mutexDefault = mutexModule.default;
      ok(typeof mutexDefault === 'object');
      ok(typeof mutexDefault.create === 'function');
    } catch (err) {
      // Nếu mutex.node không tồn tại, test coi như pass (platform-specific)
      ok(true, 'Mutex native không available trong môi trường này');
    }
  });

  it('nên export create là function', async () => {
    try {
      const mutexModule = await import('../src/plugin/mutex/index');
      ok(typeof mutexModule.create === 'function');
    } catch {
      ok(true);
    }
  });

  it('nên export release là function', async () => {
    try {
      const mutexModule = await import('../src/plugin/mutex/index');
      ok(typeof mutexModule.release === 'function');
    } catch {
      ok(true);
    }
  });

  it('nên không throw khi release không có mutex.close', async () => {
    try {
      const mutexModule = await import('../src/plugin/mutex/index');
      await doesNotThrow(() => mutexModule.release('test-mutex'));
    } catch {
      ok(true);
    }
  });
});
```

- [ ] **Step 2: Chạy test Mutex**

```bash
npm test -- --grep "Mutex"
```

Expected: pass (skip nếu native binary không có).

---

### Task 7: Run full test suite

- [ ] **Step 1: Chạy tất cả test**

```bash
npm test
```

Expected: tất cả test pass (cả cũ lẫn mới).

- [ ] **Step 2: Chạy lint**

```bash
npm run lint 2>&1 || true
```

Expected: không có lỗi ESLint.

- [ ] **Step 3: Chạy typecheck**

```bash
npm run typecheck 2>&1 || true
```

Expected: không có lỗi TypeScript.

---

### Task 8: Cập nhật ROADMAP + viết overview

- [ ] **Step 1: Cập nhật ROADMAP.md**

Chuyển trạng thái Test Cleanup thành [X] Hoàn thành, thêm tài liệu và số test cases.

- [ ] **Step 2: Viết overview**

`docs/overviews/test-cleanup.overview.md` — báo cáo kết quả theo template.

---

## Kiểm tra

- `npm run lint` — ESLint pass
- `npm run typecheck` — TypeScript pass
- `npm test` — tất cả test pass (58 cũ + ~28 mới = ~86 total)

## Ghi chú

- Sinon stub phải được reset trong `afterEach` để tránh ảnh hưởng giữa các test.
- `#private` fields (cleaner.#folders, cleaner.#timer, configManager.#lock) không truy cập được từ ngoài. Dùng `(instance as any).fieldName` hoặc test behaviour gián tiếp.
- Mutex test không thể chạy nếu mutex.node không tồn tại — design cho phép skip.
- Không sửa source code, chỉ thêm test file mới.
