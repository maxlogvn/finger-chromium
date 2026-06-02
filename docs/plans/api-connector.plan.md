# Plan: API Connector

## Các bước thực hiện

- [x] **Bước 1: Tạo RemoteEngine singleton với cấu hình từ env** (file: `src/plugin/connector/index.ts`, dòng 48-65)

    **Logic chi tiết:**
    1. Tạo `const lock = new AsyncLock()` — module-level, dùng cho đồng bộ request.
    2. Tạo `const engine = new RemoteEngine(...)` với options:
       ```ts
       {
         cwd: process.env.FINGERPRINT_CWD,
         engineTimeout: process.env.FINGERPRINT_TIMEOUT,
         requestTimeout: process.env.FINGERPRINT_TIMEOUT,
       }
       ```
       Nếu env không set → field undefined → RemoteEngine dùng default (`CWD = path.join(process.cwd(), 'data')`, `DEFAULT_TIMEOUT = 300s`).
    3. Đăng ký event handlers:
       ```ts
       engine.on('beforeDownload', () => console.log('Đang tải browser...'));
       engine.on('beforeExtract', () => console.log('Đang cài đặt browser...'));
       ```
    4. Gọi `pcapServer.listen().then(port => { engine.setArgs(['--mock-pcap-port=${port}']); })` — async, không await. PCAP server listening song song với các tác vụ khác.

    **Types (dòng 20-43):**
    ```ts
    interface EngineOptions { cwd?: string; engineTimeout?: string | number; requestTimeout?: string | number; }
    interface RunFunctionOptions { requestTimeout?: number; }
    interface ApiParams { key?: string; options?: { perfectCanvasRequest?: boolean; }; [key: string]: unknown; }
    interface EngineResult { error?: string; response?: unknown; [key: string]: unknown; }
    ```

    **Edge cases:**
    - `FINGERPRINT_CWD` không set → engine dùng CWD default (process.cwd()/data).
    - `FINGERPRINT_TIMEOUT` không set → timeout mặc định 300s.
    - PCAP server `listen()` fail (EADDRINUSE retry hết) → `engine.setArgs` không được gọi → engine start không có `--mock-pcap-port` → engine crash.

    **Tại sao:** Singleton engine đảm bảo chỉ một worker.exe chạy — tránh conflict port và tài nguyên. Timeout dùng chung cho engine và request vì engine sequential — nếu request A đang chờ, request B sẽ đợi lock.

- [x] **Bước 2: Implement api() wrapper** (file: `src/plugin/connector/index.ts`, dòng 73-88)

    **Signature:**
    ```ts
    export const api = async (name: string, params: ApiParams = {}): Promise<unknown>
    ```

    **Logic chi tiết:**
    1. `lock.acquire('client', async () => {...})` — chờ đến khi lock key 'client' available.
    2. Inside lock:
       ```ts
       const { error, ...result } = await engine.runFunction(name, params, {
         requestTimeout: params?.options?.perfectCanvasRequest ? 0 : engine.requestTimeout,
       });
       ```
       - Nếu `perfectCanvasRequest === true` → `requestTimeout = 0` (không timeout).
       - Nếu không → dùng `engine.requestTimeout` (300s mặc định).
    3. **Error normalization:**
       ```ts
       if (error) {
         throw error.includes('key is missing') ? new MissingKeyError(error) : new PluginError(error);
       }
       ```
       - `'key is missing'` → MissingKeyError (hướng dẫn set key).
       - Error khác → PluginError.
    4. **Response normalize:** `return result.response ?? result` — engine trả về `{ response: data }` hoặc trực tiếp data.

    **Edge cases:**
    - `params.options` undefined → `params?.options?.perfectCanvasRequest` là undefined → falsy → dùng engine timeout.
    - `result.response` là null/undefined → `result ?? result.response` sẽ return result.
    - `error` chứa 'key is missing' → MissingKeyError với hướng dẫn chi tiết.
    - `engine.runFunction` throw (timeout, connection error) → lock auto-release (finally).
    - Gọi api() khi engine chưa start → engine tự download + spawn (lần đầu chậm).

    **Error flow:**
    ```
    engine.runFunction() → { error: 'key is missing...' }
      → error.includes('key is missing')? → Yes → new MissingKeyError(error)
      → throw
    ```

    **Tại sao:** `perfectCanvasRequest = true` bypass timeout vì perfect canvas render có thể mất vài phút. Lock 'client' ngăn race condition — engine IPC là file-based, không support concurrent. Error normalization chuyển engine error message thành typed error để user catch chính xác.

- [x] **Bước 3: Implement cleanup()** (file: `src/plugin/connector/index.ts`, dòng 94-97)

    **Signature:**
    ```ts
    export const cleanup = async (): Promise<void>
    ```

    **Logic chi tiết:**
    1. `engine.kill()` — kill FastExecuteScript.exe (kiểm tra `#process.killed`).
    2. `await pcapServer.close()` — close TCP server, giải phóng port.

    **Edge cases:**
    - Engine chưa start → `engine.kill()` kiểm tra `#process === undefined` → no-op.
    - PCAP chưa listen → `pcapServer.close()` kiểm tra `server === undefined` → resolve ngay.
    - Gọi cleanup nhiều lần → lần 2: engine.kill() không làm gì, pcapServer.close() resolve ngay.
    - `engine.kill()` fail → không catch → throw → `pcapServer.close()` không được gọi.

    **Tại sao:** Thứ tự: engine process trước (giải phóng port, process), PCAP server sau (không còn engine cần connect). Không catch error trong cleanup — caller quyết định xử lý.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup build
```

## Ghi chú

- `MissingKeyError` throw khi error message chứa 'key is missing'.
- Lock 'client' đảm bảo chỉ một request tại một thời điểm.
- `api()` export cùng với `engine` (truy cập event handlers) và `cleanup`.
- `perfectCanvasRequest` với `requestTimeout = 0` bypass timeout.
- `engine.requestTimeout` getter trả về `#requestTimeout` hiện tại.
