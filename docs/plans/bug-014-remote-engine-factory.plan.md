# Bug #14 — RemoteEngine singleton dùng chung giữa các instance Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `RemoteEngine` từ singleton global thành factory pattern — mỗi `FingerprintPlugin` instance tạo `Connector` riêng với `RemoteEngine` độc lập.

**Architecture:** Tạo class `Connector` trong `src/plugin/connector/index.ts` bao gồm `RemoteEngine` riêng + `AsyncLock` riêng + `api()` + `cleanup()`. `FingerprintPlugin` sở hữu `#connector` riêng. PCAP server giữ nguyên module-level singleton.

**Tech Stack:** TypeScript, Node.js

---

### Task 1: Refactor Connector module — singleton → class

**Files:**
- Modify: `src/plugin/connector/index.ts` (toàn bộ)

- [ ] **Step 1: Đọc file hiện tại để xác định vị trí cần sửa**

- [ ] **Step 2: Xoá singleton engine và chuyển thành class Connector**

Xoá 3 dòng singleton:
```ts
const engine = new RemoteEngine({
  cwd: process.env.FINGERPRINT_CWD,
  engineTimeout: process.env.FINGERPRINT_TIMEOUT,
  requestTimeout: process.env.FINGERPRINT_TIMEOUT,
} as EngineOptions);
```

Xoá export `export { engine };` ở cuối file.

Thêm class Connector:

```ts
// Module-level PCAP server singleton
let initPromise: Promise<number> | undefined;

export default class Connector {
  #engine: RemoteEngine;
  #lock = new AsyncLock();

  constructor(options?: EngineOptions) {
    this.#engine = new RemoteEngine({
      cwd: process.env.FINGERPRINT_CWD,
      engineTimeout: process.env.FINGERPRINT_TIMEOUT,
      requestTimeout: process.env.FINGERPRINT_TIMEOUT,
    } as EngineOptions);

    this.#engine.on('beforeExtract', () => {
      console.log('Dang cai dat browser -- qua trinh nay co the mat mot chut thoi gian.');
    });

    this.#engine.on('beforeDownload', () => {
      console.log('Dang tai browser -- qua trinh nay co the mat mot chut thoi gian.');
    });

  }

  /**
   * Lazy init PCAP server -- module-level singleton promise.
   * Tra ve port, moi Connector set args rieng cho engine cua minh.
   */
  async #ensurePcapPort(): Promise<number> {
    if (!initPromise) {
      initPromise = pcapServer.listen().then((port: number) => {
        debug(`PCAP server dang lang nghe tai port ${port}`);
        return port;
      });
    }
    return initPromise;
  }

  get requestTimeout(): number {
    return this.#engine.requestTimeout;
  }

  setCwd(value: string): void {
    this.#engine.setCwd(value);
  }

  setRequestTimeout(value: number): void {
    this.#engine.setRequestTimeout(value);
  }

  setEngineTimeout(value: number): void {
    this.#engine.setEngineTimeout(value);
  }

  async api(name: string, params: ApiParams = {}): Promise<unknown> {
    const port = await this.#ensurePcapPort();
    this.#engine.setArgs([`--mock-pcap-port=${port}`]);
    let notifyTimer: ReturnType<typeof setTimeout> | undefined;
    return this.#lock.acquire('client', async () => {
      try {
        const { error, ...result } = (await this.#engine.runFunction(name, params, {
          requestTimeout: params?.options?.perfectCanvasRequest ? 0 : this.requestTimeout,
        } as RunFunctionOptions)) as EngineResult;
        if (error) {
          if (error.includes('key is missing')) {
            notifyTimer = notify(params.key);
            throw new MissingKeyError(error);
          }
          throw new PluginError(error);
        }
        return result.response ?? result;
      } finally {
        if (notifyTimer !== undefined) clearTimeout(notifyTimer);
      }
    });
  }

  cleanup(): void {
    this.#engine.kill();
  }
}
```

Giữ nguyên:
- `interface EngineOptions`, `ApiParams`, `EngineResult`, `RunFunctionOptions`
- `const debug = debugFactory(...)`
- `notify()` import
- `export { engine }` được xoá, thay bằng `export default Connector`

- [ ] **Step 3: Verify file không còn singleton engine và export đúng**

Check: không còn `const engine = new RemoteEngine(...)` ở module-level, không còn `export { engine }`.

---

### Task 2: Update FingerprintPlugin — dùng Connector instance

**Files:**
- Modify: `src/plugin/index.ts`

- [ ] **Step 1: Sửa import — dùng Connector thay vì api/engine/cleanup**

```ts
// Xoá dòng này:
import { api, engine, cleanup as connectorCleanup } from './connector';

// Thay bằng:
import Connector from './connector';
```

- [ ] **Step 2: Thêm #connector field vào class**

```ts
export default class FingerprintPlugin {
  protected launcher: { launch: (opts: BaseLaunchOptions) => Promise<Browser> };
  protected version: string | null = 'default';
  protected fingerprint?: PluginConfig;
  protected profile?: PluginConfig;
  protected proxy?: PluginConfig;
  #cleaner = new SettingsCleaner();
  #connector = new Connector();  // <-- thêm dòng này
  protected browser?: Browser;
  protected processId?: string;
```

- [ ] **Step 3: Cập nhật setWorkingFolder()**

```ts
setWorkingFolder(folder: string): void {
  this.#connector.setCwd(path.resolve(folder));
}
```

- [ ] **Step 4: Cập nhật setRequestTimeout()**

```ts
setRequestTimeout(timeout: number): void {
  this.#connector.setRequestTimeout(timeout || 0);
}
```

- [ ] **Step 5: Cập nhật setEngineTimeout()**

```ts
setEngineTimeout(timeout: number): void {
  this.#connector.setEngineTimeout(timeout || 0);
}
```

- [ ] **Step 6: Cập nhật fetch() — dùng this.#connector.api()**

```ts
async fetch(options: FetchOptions = {}): Promise<string> {
  return (await this.#connector.api('fetch', {
    key: serviceKey,
    options,
    version: this.version,
  } as any)) as string;
}
```

- [ ] **Step 7: Cập nhật versions() — dùng this.#connector.api()**

```ts
async versions<T extends 'default' | 'extended' = 'default'>(
  format: T = 'default' as T
): Promise<T extends 'extended' ? Version[] : string[]> {
  return (await this.#connector.api('versions', { format })) as any;
}
```

- [ ] **Step 8: Cập nhật _launch() — dùng this.#connector.api()**

Trong `_launch()` method, tìm `(await api('setup', {...}))` và thay bằng:

```ts
const setupData = (await this.#connector.api('setup', {
  ...
})) as SetupResponse;
```

- [ ] **Step 9: Cập nhật cleanup() — dùng this.#connector.cleanup()**

```ts
async cleanup(): Promise<void> {
  if (this.browser) {
    await this.browser.close().catch(() => {});
    this.browser = undefined;
  }
  this.#connector.cleanup();
  if (this.processId) {
    mutex.release(`BASProcess${this.processId}`);
  }
  await this.#cleaner.stop();
}
```

---

### Task 3: Kiểm tra

- [ ] **Step 1: Chạy typecheck**

Run: `npm run typecheck`
Expected: Không có lỗi TypeScript.
Nếu có lỗi, sửa tại chỗ.

- [ ] **Step 2: Chạy lint**

Run: `npm run lint`
Expected: Không có lỗi ESLint.

- [ ] **Step 3: Chạy build**

Run: `npm run build`
Expected: Build thành công ESM + CJS.

- [ ] **Step 4: Chạy test**

Run: `npm test`
Expected: Các test pass.
