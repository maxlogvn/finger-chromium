# Plan: RemoteEngine

## Các bước thực hiện

- [x] **Bước 1: Tạo RemoteEngine class extends EventEmitter** (file: `src/plugin/connector/engine.ts`, dòng 142-156)

    **Signature:**
    ```ts
    export default class RemoteEngine extends EventEmitter {
      #meta: EngineMeta | null = null;
      #cwd: string | null = null;
      #args: string[] = [];
      #engineTimeout: number = DEFAULT_TIMEOUT;
      #requestTimeout: number = DEFAULT_TIMEOUT;
      #process: ChildProcess | undefined = undefined;
      constructor(options: EngineOptions = {});
    }
    ```

    **Constants (dòng 35-38):**
    ```ts
    export const CLOSE_TIMEOUT = 60_000;       // 60s chờ engine đóng
    export const DEFAULT_TIMEOUT = 300_000;     // 5 phút timeout mặc định
    export const ARCH = process.arch.includes('32') ? '32' : '64';
    export const CWD = path.join(process.cwd(), 'data');
    ```

    **Logic chi tiết:**
    1. Constructor gọi `super()` (EventEmitter).
    2. Gọi `this.setCwd(options.cwd)` — resolve absolute path.
    3. Gọi `this.setArgs(options.args)` — validate array.
    4. Gọi `this.setEngineTimeout(options.engineTimeout)` — set hoặc default.
    5. Gọi `this.setRequestTimeout(options.requestTimeout)` — set hoặc default.

    **Setter logic:**
    ```ts
    setCwd(value?: string) { this.#cwd = path.resolve(value || CWD); }
    setArgs(value?: string[]) { this.#args = Array.isArray(value) ? value : []; }
    setEngineTimeout(value?: string | number) { const t = Number(value) || 0; this.#engineTimeout = t >= 0 ? t : DEFAULT_TIMEOUT; }
    setRequestTimeout(value?: string | number) { const t = Number(value) || 0; this.#requestTimeout = t >= 0 ? t : DEFAULT_TIMEOUT; }
    get requestTimeout() { return this.#requestTimeout; }
    ```

    **Edge cases:**
    - `options.cwd = undefined` → `path.resolve(undefined)` throw → `value || CWD` fallback.
    - `options.args = undefined` → setArgs nhận undefined → `value || []` → mảng rỗng.
    - `options.engineTimeout = 'abc'` → `Number('abc') = NaN` → `NaN || 0 = 0` → 0 = không timeout.
    - `ENV timeout = -1` → `-1 >= 0` false → dùng DEFAULT_TIMEOUT.

    **Tại sao:** EventEmitter để emit `beforeDownload`/`beforeExtract`. ARCH auto-detect vì engine có 2 binary riêng cho 32-bit và 64-bit.

- [x] **Bước 2: Implement resolvePackageRoot()** (file: `src/plugin/connector/engine.ts`, dòng 47-64)

    **Signature:**
    ```ts
    function resolvePackageRoot(startDir: string): string
    ```

    **Logic:**
    1. `let current = startDir`.
    2. Loop: thử `require(path.join(current, 'package.json'))`.
       - Nếu `pkg.name === 'fingerprint-chromium-engine'` → return current.
       - Nếu không (catch) → continue.
    3. `const parent = path.dirname(current)`.
       - Nếu `parent === current` (filesystem root) → throw Error.
    4. `current = parent` → lặp.
    5. Kết quả lưu vào `PACKAGE_ROOT` (module-level) — chỉ chạy một lần khi import.

    **Edge cases:**
    - __dirname là `dist/plugin/connector/` → đi lên 3 cấp: dist → package root (1-2 cấp tuỳ bundle structure).
    - package.json không chứa name → không match → continue.
    - package.json không tồn tại → require throw → catch → continue.
    - Walk đến root (vd: `C:/`) không tìm thấy → throw Error.

    **Tại sao:** Walk-up cần thiết sau tsup bundle — __dirname thay đổi linh hoạt. Dùng `createRequire` vì ESM không có require global.

- [x] **Bước 3: Implement #updateMeta()** (file: `src/plugin/connector/engine.ts`, dòng 359-385)

    **Signature:**
    ```ts
    async #updateMeta(): Promise<void>
    ```

    **Logic chi tiết:**
    1. Đọc `project.xml`: `await fs.readFile(PROJECT_PATH, 'utf8')`.
    2. Regex: `project.match(/<EngineVersion>(\d+\.\d+\.\d+)<\/EngineVersion>/)` — nếu không match, throw Error.
    3. Build URL: `http://bablosoft.com/distr/FastExecuteScript${ARCH}/${version}/FastExecuteScript.x${ARCH}.zip.meta.json`.
    4. Cache path: `path.join(this.#cwd!, `${version}_${ARCH}.json`)`.
    5. Nếu cache tồn tại → đọc và parse JSON → `this.#meta = parsed`.
    6. Nếu không → `axios.get(url)` → parse `{ Checksum, Url }` → `this.#meta = { checksum: data.Checksum, url: data.Url, version }` → lưu cache file.

    **Cache structure:**
    ```json
    { "checksum": "sha1hex...", "url": "http://...", "version": "1.2.3" }
    ```

    **Edge cases:**
    - Cache file corrupt (JSON parse fail) → throw — catch ở runFunction sẽ gọi lại.
    - `axios.get` fail (network down) → throw.
    - `PROJECT_PATH` không tồn tại → throw (package corrupt).
    - `this.#cwd` null → throw (chưa setCwd).

    **Tại sao:** Cache metadata tránh request HTTP mỗi lần khởi động. Cache file lưu theo version_ARCH để nếu version thay đổi, tự động fetch mới.

- [x] **Bước 4: Implement #startProcessInternal()** (file: `src/plugin/connector/engine.ts`, dòng 270-321)

    **Signature:**
    ```ts
    async #startProcessInternal(): Promise<ChildProcess>
    ```

    **Logic chi tiết (5 bước con):**

    **4a. Checksum verification:**
    ```ts
    if (this.#meta && (await exists(zipPath))) {
      if (this.#meta.checksum !== (await checksum(zipPath))) {
        await fs.rm(engineDir, { recursive: true, force: true });
        debug('Đã xóa engine bị lỗi (sai checksum)');
      }
    }
    ```
    - `checksum()` dùng SHA1, pipeline createReadStream → createHash.
    - Xoá cả engineDir (không chỉ zip) vì zip corrupt → extract cũng corrupt.

    **4b. Download:**
    ```ts
    if (!(await exists(engineDir))) {
      this.emit('beforeDownload');
      await fs.mkdir(engineDir, { recursive: true });
      await download(this.#meta!.url, zipPath);
    }
    ```
    - `download()` dùng axios.get(responseType: 'stream') → pipeline writeStream.

    **4c. Extract:**
    ```ts
    if (!(await exists(scriptDir))) {
      this.emit('beforeExtract');
      await fs.mkdir(scriptDir, { recursive: true });
      await extract(zipPath, { dir: scriptDir });
    }
    ```

    **4d. Config files:**
    ```ts
    await fs.copyFile(PROJECT_PATH, path.join(scriptDir, 'project.xml'));
    await fs.writeFile(path.join(scriptDir, 'worker_command_line.txt'), '--mock-connector');
    await fs.writeFile(path.join(scriptDir, 'settings.ini'), 'RunProfileRemoverImmediately=true');
    ```

    **4e. Spawn:**
    ```ts
    return new Promise<ChildProcess>((resolve, reject) => {
      const proc = execFile(
        path.join(scriptDir, 'FastExecuteScript.exe'),
        ['--silent', ...this.#args],
        { cwd: scriptDir },
        (error) => {
          if (error) reject(new InvalidEngineError(`Không thể khởi chạy... (mã lỗi: ${error.code})`));
        }
      );
      this.#process = proc;
      resolve(proc);
    });
    ```

    **Edge cases:**
    - `this.#meta` null (chưa updateMeta) → throw (cannot read properties of null).
    - Download fail (network) → engineDir không được tạo → retry next call.
    - Extract fail (disk full) → throw InvalidEngineError.
    - `execFile` spawn fail (exe không tồn tại) → callback error → reject InvalidEngineError.

    **Tại sao:** `execFile` thay vì `spawn` vì callback bắt lỗi spawn (ENOENT). `--mock-connector` cho engine chạy ở chế độ mock. `RunProfileRemoverImmediately=true` tự xoá profile khi process kết thúc.

- [x] **Bước 5: Implement #startProcess() với timeout** (file: `src/plugin/connector/engine.ts`, dòng 337-353)

    **Signature:**
    ```ts
    async #startProcess(timeout?: number): Promise<ChildProcess>
    ```

    **Logic:**
    ```ts
    if (!timeout) return await this.#startProcessInternal();
    let timer: NodeJS.Timeout | null = null;
    const engineProcess = await Promise.race([
      this.#startProcessInternal(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new EngineTimeoutError('...')), timeout).unref();
      }),
    ]);
    if (timer) clearTimeout(timer);
    return engineProcess;
    ```

    **Edge cases:**
    - `timeout = undefined` → `!undefined` là true → gọi thẳng (không timeout).
    - `timeout = 0` → `!0` là true → gọi thẳng.
    - `timeout = 5000` → race giữa startProcess và timeout 5s.
    - Download lâu > timeout → reject EngineTimeoutError.

    **Tại sao:** Timeout riêng cho start process — download lần đầu có thể lâu (engine binary ~50MB). `.unref()` cho phép Node exit ngay cả khi timer pending.

- [x] **Bước 6: Implement runFunction() — file-based IPC** (file: `src/plugin/connector/engine.ts`, dòng 184-264)

    **Signature:**
    ```ts
    async runFunction(
      name: string,
      params: unknown,
      { engineTimeout = this.#engineTimeout, requestTimeout = this.#requestTimeout }: RunFunctionOptions = {}
    ): Promise<FunctionResult>
    ```

    **Logic chi tiết (4 bước con):**

    **6a. Setup:** `if (!this.#meta) await this.#updateMeta()` + `const engineProcess = await this.#startProcess(engineTimeout)`.

    **6b. Dọn request cũ:**
    ```ts
    const requestDir = path.join(path.dirname(engineProcess.spawnfile), 'r');
    await fs.mkdir(requestDir, { recursive: true });
    for (const requestName of await fs.readdir(requestDir)) {
      const pid = Number(requestName.split('_')[0]);
      if (pid === engineProcess.pid) continue;
      kill(pid, 0); // ESRCH → process dead → xoá file
      await fs.unlink(path.join(requestDir, requestName));
    }
    ```

    **6c. Tạo request + watch:**
    ```ts
    const requestPath = path.join(requestDir, `${engineProcess.pid}_${randomUUID()}.json`);
    await fs.writeFile(requestPath, JSON.stringify({ name, params }));
    const requestWatcher = chokidar.watch(requestPath, { awaitWriteFinish: true });
    ```

    **6d. Promise response:**
    ```ts
    responseStr = await new Promise<string>((resolve, reject) => {
      let requestTimer = null;
      if (requestTimeout) requestTimer = setTimeout(() => reject(new RequestTimeoutError(...)), requestTimeout).unref();
      const closeHandler = () => { /* engine close → resolve '' sau CLOSE_TIMEOUT */ };
      requestWatcher.on('change', async () => {
        const content = await fs.readFile(requestPath, 'utf8');
        clearTimeout(requestTimer);
        await fs.unlink(requestPath);
        resolve(content);
      });
      engineProcess.once('close', closeHandler);
    });
    ```
    - Sau promise: `await requestWatcher.close()`.
    - Parse: `if (!responseStr) return { error: 'Engine process closed unexpectedly' }; return JSON.parse(responseStr)`.

    **Edge cases:**
    - `requestTimeout = 0` → không set timeout promise.
    - Engine process đóng trong lúc chờ → `closeHandler` set timer 60s, resolve ''.
    - Response JSON parse fail → return `{ error: 'Invalid response format' }`.
    - Request file không được engine xử lý (engine busy) → timeout → reject.

    **Tại sao:** File-based IPC đơn giản, ổn định — không cần port. Dọn request cũ tránh tích tụ file rác. `awaitWriteFinish` đảm bảo chokidar fire sau khi engine ghi xong.

- [x] **Bước 7: Implement kill()** (file: `src/plugin/connector/engine.ts`, dòng 327-332)

    **Signature:**
    ```ts
    kill(): void
    ```

    **Logic:**
    ```ts
    if (this.#process && !this.#process.killed) {
      this.#process.kill();
      this.#process = undefined;
    }
    ```

    **Edge cases:**
    - `#process` undefined (chưa start) → no-op.
    - `#process.killed = true` (đã killed) → skip.
    - Gọi kill nhiều lần → lần 2: `#process = undefined` → no-op.
    - `#process.kill()` fail (permission denied) → throw — caller có thể catch.

    **Tại sao:** `#process.kill()` trên Windows gửi termination signal tương đương taskkill. Set undefined giúp multi-call safety.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup build
```

## Ghi chú

- `resolvePackageRoot()` walk-up tìm package root — critical sau tsup bundle.
- `DEFAULT_TIMEOUT = 300s`, `CLOSE_TIMEOUT = 60s`.
- Events: `'beforeDownload'`, `'beforeExtract'`.
- Checksum SHA1 — tự động xoá và tải lại nếu sai.
- `execFile` thay `spawn` vì cần callback bắt lỗi spawn.
- File-based IPC: request `.json` → engine ghi response vào cùng file → chokidar detect change.
