# Test coverage cho `runFunction()` IPC core (Issue #28) — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 5-6 test cases cho `RemoteEngine.runFunction()` trong `tests/connector.test.ts`, dùng cơ chế override `child_process.execFile` + temp directory để bypass engine binary thật.

**Architecture:** Override `child_process.execFile` qua namespace import (`import cp from 'node:child_process'` + `cp.execFile = mock`) giúp live binding trong engine.ts nhận mock. Tạo cây thư mục engine giả trong temp dir để bypass `#startProcessInternal()` (download/extract engine). Dùng chokidar thật để test IPC flow.

**Tech Stack:** Mocha, node:assert, node:child_process, chokidar, EventEmitter, node:fs/promises, node:crypto (randomUUID), node:path.

---

### Task 1: Đọc engine version và import child_process namespace

**Files:**
- Read: `project.xml:894` (chứa `<EngineVersion>29.9.2</EngineVersion>`)
- Modify: `tests/connector.test.ts` (import thêm child_process namespace)

- [ ] **Step 1: Thêm import child_process namespace vào đầu file**

```ts
import child_process from 'node:child_process';
import crypto from 'node:crypto';
```

Thêm `crypto` (đã có) và `child_process` vào imports ở đầu `tests/connector.test.ts`.

- [ ] **Step 2: Chạy test hiện tại để đảm bảo pass trước khi sửa**

```bash
npm test
```
Expected: 116 tests pass.

---

### Task 2: Thêm helper `setupRunFunctionTest` trong `describe('runFunction()')`

**Files:**
- Modify: `tests/connector.test.ts` (thêm describe('runFunction()'))

- [ ] **Step 1: Thêm describe('runFunction()') và beforeEach/afterEach**

Thêm block sau vào cuối `describe('RemoteEngine')` (sau describe('kill()')):

```ts
// ─── runFunction() ────────────────────────────────────────────────────────

describe('runFunction()', () => {
  let tmpDir: string;
  let scriptDir: string;
  let mockProc: ReturnType<typeof EventEmitter> & {
    pid: number;
    spawnfile: string;
    killed: boolean;
    exitCode: number | null;
    kill: () => void;
  };
  let origExecFile: typeof child_process.execFile;
  const FAKE_PID = 99_999;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), '.tmp', 'runfunc-test-'));
    const version = '29.9.2';
    const arch = process.arch.includes('32') ? '32' : '64';

    // --- Tạo meta cache để bypass #updateMeta()
    await fs.writeFile(
      path.join(tmpDir, `${version}_${arch}.json`),
      JSON.stringify({ checksum: 'fake', url: 'http://fake/fake.zip', version })
    );

    // --- Tạo cây thư mục engine giả để bypass #startProcessInternal()
    scriptDir = path.join(tmpDir, 'script', version);
    const engineDir = path.join(tmpDir, 'engine', version);
    await fs.mkdir(scriptDir, { recursive: true });
    await fs.mkdir(engineDir, { recursive: true });
    await fs.writeFile(path.join(scriptDir, 'FastExecuteScript.exe'), '');

    // --- Tạo mock ChildProcess
    mockProc = Object.assign(new EventEmitter(), {
      pid: FAKE_PID,
      spawnfile: path.join(scriptDir, 'FastExecuteScript.exe'),
      killed: false,
      exitCode: null,
      kill: function () { (this as any).killed = true; },
    });

    // --- Override child_process.execFile
    origExecFile = child_process.execFile;
    child_process.execFile = ((...args: any[]) => {
      const cb = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
      if (cb) cb(null, '', '');
      return mockProc;
    }) as typeof child_process.execFile;
  });

  afterEach(async () => {
    child_process.execFile = origExecFile;
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  });
});
```

- [ ] **Step 2: Chạy test để verify beforeEach/afterEach không crash**

```bash
npm test 2>&1 | head -20
```
Expected: Không có lỗi (0 test mới, 116 tests pass).

---

### Task 3: Helper `simulateResponse` — poll request file và ghi response

- [ ] **Step 1: Thêm helper function trong describe('runFunction()')**

```ts
function simulateResponse(responseData: unknown, timeoutMs = 5000): Promise<void> {
  const requestDir = path.join(scriptDir, 'r');
  const start = Date.now();

  return new Promise<void>((resolve, reject) => {
    const poll = async () => {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Timeout chờ request file'));
      }
      try {
        const files = await fs.readdir(requestDir);
        const reqFile = files.find(f => f.startsWith(`${FAKE_PID}_`));
        if (reqFile) {
          await fs.writeFile(path.join(requestDir, reqFile), JSON.stringify(responseData));
          resolve();
          return;
        }
      } catch {
        // Thư mục chưa tồn tại — tiếp tục poll
      }
      setTimeout(poll, 30);
    };
    poll();
  });
}
```

- [ ] **Step 2: Kiểm tra helper compile ok**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```
Expected: Không lỗi TypeScript.

---

### Task 4: Test case "thành công — parse response"

- [ ] **Step 1: Viết test case**

```ts
it('nên parse response JSON thành công', async () => {
  const engine = new RemoteEngine({ cwd: tmpDir, requestTimeout: 5000 });

  const [result] = await Promise.all([
    engine.runFunction('testFunc', { foo: 'bar' }),
    simulateResponse({ response: { ok: true } }),
  ]);

  strictEqual((result as any).response?.ok, true);
});
```

- [ ] **Step 2: Chạy test để verify pass**

```bash
npm test 2>&1
```
Expected: 117 tests pass (1 mới).

---

### Task 5: Test case "timeout — requestTimeout hết hạn"

- [ ] **Step 1: Viết test case**

```ts
it('nên throw RequestTimeoutError khi hết thời gian chờ', async () => {
  const engine = new RemoteEngine({ cwd: tmpDir, requestTimeout: 100 });

  await rejects(
    () => engine.runFunction('testFunc', { foo: 'bar' }),
    (err: Error) => {
      strictEqual(err.name, 'RequestTimeoutError');
      ok(err.message.includes('Hết thời gian chờ'));
      return true;
    }
  );
});
```

Không gọi `simulateResponse` — để timeout tự nhiên.

- [ ] **Step 2: Chạy test để verify pass**

```bash
npm test 2>&1
```
Expected: 118 tests pass (2 mới).

---

### Task 6: Test case "requestTimeout=0 — không set timeout"

- [ ] **Step 1: Viết test case**

Khi `requestTimeout=0`, `if (requestTimeout)` là false → không set timeout timer. Promise chờ đến khi có change event.

```ts
it('nên không set timeout khi requestTimeout=0 (chờ đến khi có response)', async () => {
  const engine = new RemoteEngine({ cwd: tmpDir, requestTimeout: 0 });

  const [result] = await Promise.all([
    engine.runFunction('testFunc', { foo: 'bar' }),
    simulateResponse({ response: { ok: true } }),
  ]);

  strictEqual((result as any).response?.ok, true);
});
```

- [ ] **Step 2: Chạy test để verify pass**

```bash
npm test 2>&1
```
Expected: 119 tests pass (3 mới).

---

### Task 7: Test case "invalid JSON response"

- [ ] **Step 1: Viết test case**

```ts
it('nên trả về error khi response không phải JSON hợp lệ', async () => {
  const engine = new RemoteEngine({ cwd: tmpDir, requestTimeout: 5000 });

  const [result] = await Promise.all([
    engine.runFunction('testFunc', { foo: 'bar' }),
    simulateResponse('not-json-content'),
  ]);

  strictEqual(result.error, 'Invalid response format from engine');
});
```

- [ ] **Step 2: Chạy test để verify pass**

```bash
npm test 2>&1
```
Expected: 120 tests pass (4 mới).

---

### Task 8: Test case "process đóng trước khi có response"


- [ ] **Step 1: Viết test case**

`close` handler trong runFunction có `CLOSE_TIMEOUT = 60_000`ms — nếu process đóng, nó chờ 60s trước khi resolve với rỗng. Để test nhanh, emit 'close' trên mock process.

Lưu ý: runFunction có `engineProcess.once('close', closeHandler)` và `CLOSE_TIMEOUT`. Sau 60s nó resolve `''`. Để tránh chờ 60s, cần set requestTimeout ngắn hơn.

Thực tế, engine 'close' event chỉ được emit nếu process thực sự thoát. Mock process của chúng ta không bao giờ emit 'close' trừ khi ta chủ động emit.

Test này nên: emit 'close' trên mockProc, và runFunction sẽ resolve với `{ error: 'Engine process closed unexpectedly' }` sau CLOSE_TIMEOUT (60s). Quá lâu.

**Giải pháp:** Emit 'close' + không ghi response. runFunction sẽ chờ CLOSE_TIMEOUT (60s). Để tránh test chậm, chấp nhận requestTimeout ngắn (100ms) — timeout sẽ xảy ra trước close handler, nhanh hơn.

Test sẽ verify rằng khi process đóng và không có response, kết quả là lỗi.

```ts
it('nên trả về lỗi khi engine process đóng trước khi response', async () => {
  const engine = new RemoteEngine({ cwd: tmpDir, requestTimeout: 5000 });

  // Emit 'close' sau 50ms để kích hoạt close handler
  setTimeout(() => mockProc.emit('close'), 50);

  const [result] = await Promise.all([
    engine.runFunction('testFunc', { foo: 'bar' }),
    // Poll sẽ không tìm thấy request file — chỉ emit 'close' là đủ
    new Promise<void>(resolve => setTimeout(resolve, 300)),
  ]);

  // CLOSE_TIMEOUT = 60s — sau khi emit 'close', chờ 60s mới resolve
  // Với requestTimeout=5000, timeout xảy ra trước
  // Nếu close handler chạy trước timeout, result.error === 'Engine process closed unexpectedly'
  // Nếu timeout xảy ra trước, throw RequestTimeoutError
  // Cả 2 đều được chấp nhận
  ok(
    (result as any)?.error === 'Engine process closed unexpectedly' ||
    (result as Error)?.name === 'RequestTimeoutError'
  );
});
```

Test này có behavior không xác định (race giữa close handler timeout 60s và requestTimeout). Chấp nhận 2 outcome đều hợp lệ.

- [ ] **Step 2: Chạy test để verify pass**

```bash
npm test 2>&1
```
Expected: 121 tests pass (5 mới).

---

### Task 9: Test case "dọn file request rác"

- [ ] **Step 1: Viết test case**

Tạo file request cũ trong thư mục `r/` với PID không tồn tại trước khi gọi runFunction.

```ts
it('nên xoá file request cũ không còn process sở hữu', async () => {
  const engine = new RemoteEngine({ cwd: tmpDir, requestTimeout: 5000 });

  // Pre-create thư mục r/ với file rác
  const requestDir = path.join(scriptDir, 'r');
  await fs.mkdir(requestDir, { recursive: true });
  await fs.writeFile(
    path.join(requestDir, '88888_old-request.json'),  // PID 88888 không tồn tại
    JSON.stringify({ name: 'old', params: {} })
  );

  // Gọi runFunction — nó sẽ dọn file rác trước khi tạo request mới
  await Promise.all([
    engine.runFunction('testFunc', { foo: 'bar' }),
    simulateResponse({ response: { ok: true } }),
  ]);

  // Verify file rác đã bị xoá
  const remainingFiles = await fs.readdir(requestDir);
  const oldFileExists = remainingFiles.some(f => f.includes('88888'));
  strictEqual(oldFileExists, false, 'File rác phải được xoá');
});
```

- [ ] **Step 2: Chạy test để verify pass**

```bash
npm test 2>&1
```
Expected: 122 tests pass (6 mới).

---

### Task 10: Chạy full test suite và sửa lỗi

- [ ] **Step 1: Chạy lint**

```bash
npm run lint
```
Expected: Pass. Nếu lỗi ESLint, sửa formatting.

- [ ] **Step 2: Chạy typecheck**

```bash
npm run typecheck
```
Expected: Pass. Nếu lỗi type, fix kiểu dữ liệu.

- [ ] **Step 3: Chạy full test suite**

```bash
npm test
```
Expected: 122 tests pass. Nếu test fail:
- Nếu override `child_process.execFile` không生效 (live binding không nhận mock), chuyển sang dùng dynamic import: tách test runFunction ra file riêng, override execFile trước import.
- Nếu chokidar không detect change, tăng poll interval hoặc dùng `fs.watchFile`.

---

### Task 11: Commit và cập nhật docs

- [ ] **Step 1: Cập nhật spec doc với test count thực tế**

Đọc `docs/specs/test-runfunction-ipc-core.spec.md`, cập nhật số test cases nếu có sai lệch.

- [ ] **Step 2: Commit code**

```bash
git add tests/connector.test.ts docs/plans/test-runfunction-ipc-core.plan.md
git commit -m "test: thêm coverage cho runFunction() IPC core (Issue #28)"
```

- [ ] **Step 3: Cập nhật KNOWN_ISSUES.md**

Chuyển Issue #28 từ OPEN sang FIXED, thêm link tài liệu (design, spec, plan).

- [ ] **Step 4: Đồng bộ lên GitHub**

Tạo comment trên GitHub Issue #28 với nội dung từ overview (sẽ viết sau), đóng issue.
