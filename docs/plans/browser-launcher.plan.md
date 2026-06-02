# Plan: Browser Launcher

## Các bước thực hiện

- [x] **Bước 1: Tạo launch() function — spawn Chromium + parse DevTools URL** (file: `src/plugin/launcher/index.ts`, dòng 41-99)

    **Signature:**
    ```ts
    export const launch = async ({
      args = [],
      timeout = 30000,
      userDataDir = '',
      debuggingPort = 0,
      executablePath = '',
    }: LaunchOptions = {}): Promise<Browser>
    ```

    **Types (dòng 16-33):**
    ```ts
    export interface Browser {
      process: ChildProcess;
      port: number;
      url: string;
      configure(): Promise<void>;
      close(): Promise<void>;
    }
    export interface LaunchOptions {
      debuggingPort?: number;
      userDataDir?: string;
      headless?: boolean;
      timeout?: number;
      args?: string[];
      executablePath?: string;
    }
    ```

    **Logic chi tiết (3 bước con):**

    **1a. Build args + spawn:**
    ```ts
    const resolvedArgs = userDataDir ? [...args, `--user-data-dir=${path.resolve(userDataDir)}`] : [...args];
    const childProcess = spawn(executablePath, [...resolvedArgs, `--remote-debugging-port=${debuggingPort}`], {
      detached: false,
      shell: false,
    });
    ```
    - `--user-data-dir` chỉ thêm nếu userDataDir không rỗng.
    - `path.resolve()` chuẩn hoá đường dẫn.
    - `detached: false` — child process gắn với parent, không tạo process group riêng.
    - `shell: false` — exec trực tiếp, không qua shell (tránh injection).

    **1b. Parse DevTools URL từ stderr/stdout:**
    ```ts
    const url = await new Promise<string>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (timeout) timeoutId = setTimeout(onTimeout, timeout);
      createInterface({ input: childProcess.stderr! }).on('line', onLine);
      createInterface({ input: childProcess.stdout! }).on('line', onLine);
      function onLine(line: string): void {
        const match = line.match(/DevTools listening on (.*)/);
        if (match) { clearTimeout(timeoutId); resolve(match[1]); }
      }
      function onTimeout(): void {
        reject(new Error(`Timed out after ${timeout}ms while trying to launch the browser.`));
      }
    });
    ```
    - Regex: `DevTools listening on (.*)` — match URL (vd: `ws://127.0.0.1:1234/devtools/...`).
    - Parse cả stderr và stdout — Chromium output không cố định.

    **1c. Parse port + return:**
    ```ts
    const port = Number(new URL(url).port);
    ```

    **Edge cases:**
    - `timeout = 0` → không set timeout → chờ vô hạn đến khi Chromium in URL.
    - Chromium không in URL (crash sớm) → timeout → reject.
    - Chromium in URL ở stderr → OK. stdout → OK.
    - `userDataDir` path có space → `path.resolve` chuẩn hoá → spawn với path trong quotes.
    - `executablePath` rỗng → spawn fail (ENOENT) → reject.
    - `debuggingPort = 0` → OS random → port trong URL là port thật.

    **Tại sao:** Parse cả 2 stream đề phòng Chromium output linh hoạt. `--remote-debugging-port=0` tránh conflict port.

- [x] **Bước 2: Tạo close() method — kill process tree với taskkill** (file: `src/plugin/launcher/index.ts`, dòng 77-90)

    **Signature:**
    ```ts
    const close = async (): Promise<void>
    ```

    **Logic chi tiết:**
    ```ts
    const close = async (): Promise<void> => {
      if (childProcess.pid && !childProcess.killed) {
        return new Promise<void>((resolve) => {
          exec(`taskkill /pid ${childProcess.pid} /T /F`, (err) => {
            if (err) childProcess.kill();  // fallback nếu taskkill fail
            (childProcess as any).killed = true;
            resolve();
          });
        });
      }
    };
    ```
    - `/T` — kill process tree (worker.exe + child Chromium processes).
    - `/F` — force kill.
    - `taskkill` fail (process đã chết) → fallback `childProcess.kill()`.
    - Set `killed = true` manually vì `childProcess.killed` không tự set khi taskkill.
    - Nếu `childProcess.pid` undefined hoặc `childProcess.killed === true` → no-op.

    **Edge cases:**
    - Process đã tự thoát → `taskkill` fail (PID not found) → fallback `childProcess.kill()` (cũng fail nhưng catch bởi exec callback).
    - Gọi close nhiều lần → lần 2: `childProcess.killed` là true (set thủ công ở lần 1) → no-op.
    - `childProcess.pid` undefined (process chưa spawn) → no-op.

    **Tại sao:** `taskkill /T /F` là Windows-specific — cần kill cả process tree vì worker.exe spawn Chromium ở child process. `childProcess.kill()` thuần không kill process tree.

- [x] **Bước 3: Return Browser object** (file: `src/plugin/launcher/index.ts`, dòng 92-98)

    **Return:**
    ```ts
    return {
      url,              // DevTools URL string
      port,             // parsed port number
      close,            // close method
      process: childProcess, // raw ChildProcess reference
      configure: async () => {},  // no-op
    };
    ```

    **Edge cases:**
    - `close()` được gọi trước khi URL parsed → Promise đang pending → close không ảnh hưởng parse.

    **Tại sao:** `configure()` là no-op vì inject fingerprint xảy ra ở tầng engine (FastExecuteScript.exe), không phải launcher. Giữ interface để consistency với lifecycle.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup build
```

## Ghi chú

- `close()` dùng `taskkill /T /F` (Windows-specific) — kill process tree.
- `configure()` là no-op — fingerprint inject ở tầng engine.
- Timeout mặc định 30s. Regex: `/DevTools listening on (.*)/`.
- `debuggingPort = 0` → OS random port.
