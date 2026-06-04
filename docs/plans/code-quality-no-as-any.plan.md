# Plan: Loại bỏ hoàn toàn `as any` khỏi codebase

Tham chiếu: [Design](../designs/code-quality-no-as-any.design.md) | [Spec](../specs/code-quality-no-as-any.spec.md)

## File structure

| File | Vai trò | Thay đổi |
|------|---------|----------|
| `src/plugin/connector/index.ts` | Mở rộng `ApiParams.options` từ type hẹp sang `unknown` | 1 chỗ |
| `src/plugin/index.ts` | Sửa 6 chỗ `as any` trong `fetch/versions/configure/_launch` | 6 chỗ |
| `src/plugin/launcher/index.ts` | Dùng `@ts-expect-error` cho `killed` read-only | 1 chỗ |
| `src/adapter/playwright/engine.ts` | Type `launch` opts là `BaseLaunchOptions` | 1 chỗ |
| `src/adapter/playwright/utils.ts` | Duck-typing `newContext` bằng `in` operator | 1 chỗ |
| `tests/*.test.ts` | Thay `as any` bằng cast cụ thể hoặc interface test | 37 chỗ |

---

## Các bước thực hiện

### Bước 1: Mở rộng `ApiParams.options` trong connector

- [ ] **1a. Sửa `connector/index.ts` -- widen `ApiParams.options` type**

    File: `src/plugin/connector/index.ts:34`

    Hiện tại:
    ```ts
    interface ApiParams {
      key?: string;
      options?: {
        perfectCanvasRequest?: boolean;
      };
      [key: string]: unknown;
    }
    ```

    Sửa thành:
    ```ts
    interface ApiParams {
      key?: string;
      options?: unknown;
      [key: string]: unknown;
    }
    ```

    Lý do: `FetchOptions` là interface rộng hơn nhiều so với `{ perfectCanvasRequest?: boolean }`.
    `ApiParams.options` chỉ đóng vai trò "container để engine nhận biết" -- không cần type hẹp ở đây.
    Các API call `fetch`, `setup`, `versions` đều pass object khác nhau, nên `unknown` là phù hợp.

- [ ] **1b. Sửa chỗ dùng `params?.options?.perfectCanvasRequest` trong connector**

    File: `src/plugin/connector/index.ts:122`

    Hiện tại:
    ```ts
    requestTimeout: params?.options?.perfectCanvasRequest ? 0 : this.requestTimeout,
    ```

    Vì `options` giờ là `unknown`, cần optional chaining cụ thể hơn:
    ```ts
    requestTimeout: (params?.options as { perfectCanvasRequest?: boolean } | undefined)?.perfectCanvasRequest ? 0 : this.requestTimeout,
    ```

### Bước 2: Fix API params type trong `plugin/index.ts`

    **Lưu ý:** Sau bước 1 (`ApiParams.options` thành `unknown`), các object literal
    truyền vào `api()` sẽ tự động khớp với `ApiParams` (nhờ `[key: string]: unknown`).
    Do đó `as any` ở fetch và setup params tự động hết lỗi. Các interface dưới đây
    là optional (chỉ để documentation) -- có thể skip nếu TS không bắt buộc.

- [ ] **2a. Thêm interface `FetchParams` và `SetupParams` (optional)**

    File: `src/plugin/index.ts` (sau dòng 41, cạnh `SetupResponse`)

    ```ts
    interface FetchParams {
      key: string | undefined;
      options: FetchOptions;
      version: string | null;
    }

    interface SetupParams {
      proxy: PluginConfig | undefined;
      fingerprint: PluginConfig | undefined;
      version: string | null;
      profile: PluginConfig;
      pid: string;
      key: string | undefined;
    }
    ```

- [ ] **2b. Sửa `fetch()` -- bỏ `as any` trên params**

    File: `src/plugin/index.ts:199-203`

    Chỉ cần bỏ `as any`:
    ```ts
    return (await this.#connector.api('fetch', {
      key: this.#serviceKey,
      options,
      version: this.version,
    })) as string;
    ```

- [ ] **2c. Sửa `versions()` -- thay `as any` bằng `as unknown as ...`**

    File: `src/plugin/index.ts:215`

    ```ts
    return (await this.#connector.api('versions', { format })) as unknown as T extends 'extended' ? Version[] : string[];
    ```

- [ ] **2d. Sửa `_launch()` -- bỏ `as any` trên setup params**

    File: `src/plugin/index.ts:239-249`

    Chỉ cần bỏ `as any`:
    ```ts
    const setupData = (await this.#connector.api('setup', {
      proxy: this.proxy,
      fingerprint: this.fingerprint,
      version: this.version,
      profile: this.profile ?? {
        value: getProfilePath(options as any),
        options: { loadProxy: true, loadFingerprint: true },
      },
      pid: crypto.randomUUID(),
      key: typeof options.key === 'string' ? options.key : this.#serviceKey,
    })) as SetupResponse;
    ```

    Nhưng `getProfilePath(options as any)` vẫn còn -- chuyển sang bước 4a xử lý.

### Bước 3: Fix `configure()` spread args

- [ ] **3a. Sửa `FingerprintPlugin.configure()` -- type `_args` chính xác**

    File: `src/plugin/index.ts:230-232`

    Hiện tại:
    ```ts
    protected async configure(..._args: any[]): Promise<void> {
      if (typeof this.#configManager.configure === 'function') return (this.#configManager.configure as any)(..._args);
    }
    ```

    Sửa thành:
    ```ts
    protected async configure(
      cleanup: Parameters<typeof this.#configManager.configure>[0],
      browser: Parameters<typeof this.#configManager.configure>[1],
      bounds: Parameters<typeof this.#configManager.configure>[2],
      sync: Parameters<typeof this.#configManager.configure>[3],
    ): Promise<void> {
      if (typeof this.#configManager.configure === 'function') {
        return this.#configManager.configure(cleanup, browser, bounds, sync);
      }
    }
    ```

    Lý do: Không cần spread -- gọi thẳng 4 params. Bỏ `as any`.

### Bước 4: Fix merge options trong `_launch()`

- [ ] **4a. Export `GetProfilePathOptions` từ utils + sửa call**

    File: `src/plugin/utils.ts:43` -- thêm `export`:
    ```ts
    export interface GetProfilePathOptions {
      args?: string[];
      userDataDir?: string;
    }
    ```

    File: `src/plugin/index.ts:244` -- import `GetProfilePathOptions` từ `./utils`
    và bỏ `as any`:
    ```ts
    value: getProfilePath(options),
    ```

    `BaseLaunchOptions` extends `SpawnOptions (LaunchOptions)` có `userDataDir?: string`
    và `args?: string[]`, khớp với `GetProfilePathOptions`.

- [ ] **4b. Sửa `launch` call -- tạo biến trung gian thay `as any`**

    File: `src/plugin/index.ts:263-270`

    Hiện tại:
    ```ts
    const browser = await activeLauncher.launch({
      ...options,
      headless: false,
      userDataDir: undefined,
      defaultViewport: undefined,
      executablePath: `${browserPath}/worker.exe`,
      args: [`--parent-process-id=${pid}`, `--unique-process-id=${id}`, ...defaultArgs({ ...options, ...config })],
    } as any);
    ```

    Sửa thành:
    ```ts
    const launchOpts: BaseLaunchOptions = {
      ...options,
      headless: false,
      userDataDir: undefined,
      defaultViewport: undefined,
      executablePath: `${browserPath}/worker.exe`,
      args: [`--parent-process-id=${pid}`, `--unique-process-id=${id}`, ...defaultArgs({ ...options, ...config })],
    };
    const browser = await activeLauncher.launch(launchOpts);
    ```

    Nếu TS lỗi `defaultViewport` không nhận `undefined`, sửa:
    ```ts
    defaultViewport: null as unknown as { width: number; height: number } | null,
    ```

### Bước 5: Fix duck-typing trong utils.ts

- [ ] **5a. Sửa `bindHooks()` -- dùng `in` operator**

    File: `src/adapter/playwright/utils.ts:72`

    Hiện tại:
    ```ts
    if (!isBrowser(target) && !(target as any).newContext) {
    ```

    Sửa thành:
    ```ts
    if (!isBrowser(target) && !('newContext' in target)) {
    ```

    `in` operator là type-safe, TS hiểu đây là type guard runtime.

### Bước 6: Fix `killed` read-only trong launcher

- [ ] **6a. Sửa `close()` -- dùng `@ts-expect-error`**

    File: `src/plugin/launcher/index.ts:86`

    Hiện tại:
    ```ts
    (childProcess as any).killed = true;
    ```

    Sửa thành:
    ```ts
    // --- Cần set killed=true để tránh gọi taskkill lại nếu process đã thoát
    // @ts-expect-error: ChildProcess.killed là read-only, nhưng cần set ở runtime
    childProcess.killed = true;
    ```

### Bước 7: Fix launcher type trong engine.ts

- [ ] **7a. Sửa `launchPersistentContext()` -- type `launch` opts và return**

    File: `src/adapter/playwright/engine.ts:76-80`

    Hiện tại:
    ```ts
    launcher: {
      launch: async (opts: any = {}) => {
        const filteredArgs = (opts.args ?? []).filter((arg: string) => !arg.startsWith('--user-data-dir'));
        return this.pwLauncher[method](userDataDir, { ...opts, args: filteredArgs });
      },
    } as any,
    ```

    Sửa thành:
    ```ts
    launcher: {
      launch: async (opts: BaseLaunchOptions = {}) => {
        const filteredArgs = (opts.args ?? []).filter((arg: string) => !arg.startsWith('--user-data-dir'));
        return this.pwLauncher[method](userDataDir, { ...opts, args: filteredArgs }) as unknown as Browser;
      },
    } as unknown as { launch: (opts: BaseLaunchOptions) => Promise<Browser> },
    ```

    Cần import `BaseLaunchOptions` từ `../../plugin`.

### Bước 8: Fix `as any` trong test files

- [ ] **8a. `tests/connector.test.ts` (4 chỗ)**

    - Line 238: `(server.address() as any).port` -> `(server.address() as { port: number }).port`
    - Line 308: `(this as any).killed = true` -> dùng `this satisfies { killed: boolean }`
    - Line 354, 382: `(result as any).response?.ok` -> dùng `(result as { response?: { ok: boolean } }).response?.ok`

- [ ] **8b. `tests/browser.test.ts` (10 chỗ)**

    - Lines 491, 503, 515: `{ proxy: ... } as any` -> cast cụ thể với `as PluginLaunchOptions`
    - Lines 588-590: `(engine as any).isLaunched` / `.options` -> dùng `as unknown as` với interface test cụ thể
    - Line 648, 674, 707, 713: tương tự

- [ ] **8c. `tests/profile.test.ts` (7 chỗ)**

    - Tất cả là `(dm as any).instanceTempDir` -> dùng `(dm as unknown as { instanceTempDir: string }).instanceTempDir`

- [ ] **8d. `tests/cleanup.test.ts` (12 chỗ)**

    - Lines 79, 92, 106: `{ ... } as any` -> dùng interface mock cụ thể
    - Lines 165, 166: global stub `as any` -> dùng `as unknown as typeof clearInterval`
    - Lines 211, 221, 230, 240, 249, 266, 301, 334: cast mock object -> interface cụ thể

- [ ] **8e. `tests/utils.test.ts` (4 chỗ)**

    - Lines 286-288: `(loader as any).target`/`.version`/`.packages` -> dùng `as unknown as { target: string; version: string; packages: string[] }`

---

## Kiểm tra

Chạy theo thứ tự:

```bash
npm run typecheck   # không còn lỗi nào
npm run lint         # không lỗi ESLint mới
npm test             # 164 tests vẫn pass
npm run build        # bundle ESM + CJS thành công
```

## Ghi chú

- Các bước 1-7 độc lập với nhau, có thể làm song song.
- Bước 8 (test files) phụ thuộc vào bước 1-7 hoàn thành để type mới match.
- `satisfies` keyword yêu cầu TypeScript >= 4.9 (dự án dùng ~5.8 -- OK).
- Một số chỗ trong test dùng `as any` để truy cập private field (`#instanceTempDir`) không thể
  fix kiểu thông thường -- cần dùng `as unknown as { instanceTempDir: string }`.
