# Overview: RemoteEngine

## Tóm tắt

Đã triển khai RemoteEngine -- tải engine binary từ bablosoft.com, verify SHA1 checksum, giải nén, copy project.xml, tạo settings.ini + worker_command_line.txt, spawn `FastExecuteScript.exe`, file-based IPC với chokidar, cache metadata, timeout configurable.

## Kiến trúc

```
RemoteEngine extends EventEmitter
  |-- startProcess()          download -> extract -> spawn
  |     |-- downloadEngine()  axios + SHA1 verify
  |     |-- extractZip()      extract-zip
  |     |-- copyProjectXml()  copy cấu hình project
  |     |-- createSettings()  tạo settings.ini
  |     |-- spawnProcess()    child_process.spawn
  |
  |-- runFunction()           file IPC
  |     |-- write JSON request -> {id}.txt
  |     |-- chokidar watch response -> {id}.txt
  |     |-- parse JSON response
  |
  |-- kill()                  kill process tree
  |     |-- taskkill /T /F    (Windows)
  |     |-- CLOSE_TIMEOUT     (graceful -> force)
  |
  |-- updateMeta()            fetch + cache
  |-- resolvePackageRoot()    walk-up tìm node_modules
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| Class + constructor | `src/plugin/connector/engine.ts` | 30-70 |
| `updateMeta()` | `src/plugin/connector/engine.ts` | 72-105 |
| `startProcess()` | `src/plugin/connector/engine.ts` | 107-180 |
| `#startProcessInternal()` | `src/plugin/connector/engine.ts` | 182-280 |
| `runFunction()` | `src/plugin/connector/engine.ts` | 282-340 |
| `kill()` | `src/plugin/connector/engine.ts` | 342-380 |
| `resolvePackageRoot()` | `src/plugin/connector/engine.ts` | 382-400 |
| Chokidar watcher setup | `src/plugin/connector/engine.ts` | 402-430 |
| Constants + defaults | `src/plugin/connector/engine.ts` | 1-28 |

## File-based IPC flow

```
runFunction(name, params)
  -> tạo requestId (Date.now + random)
  -> ghi JSON: { requestId, name, params } -> `{pwd}/t/{requestId}.txt`
  -> chokidar.watch(`{pwd}/t/`) -- lọc file theo requestId
  -> Promise.race:
       |-- chokidar thấy response file -> read + parse JSON
       |-- timeout (DEFAULT_TIMEOUT = 300s)
  -> xoá request file

Request format:
{ requestId: number, name: string, params: object }

Response format:
{ requestId: number, result?: any, error?: string }
```

## Các bước `#startProcessInternal()`

1. **Download engine** từ `https://api.bablosoft.com/` -- verify SHA1 checksum từ metadata.
2. **Giải nén** bằng `extract-zip` -- output vào `ENGINE_WORKING_DIR`.
3. **Copy `project.xml`** -- cấu hình project mẫu cho engine.
4. **Tạo `settings.ini`** -- chứa `browserPath` trỏ đến Playwright Chromium executable.
5. **Tạo `worker_command_line.txt`** -- chứa extra Chromium command line args.
6. **Spawn `FastExecuteScript.exe`** -- child process với `cwd` là `ENGINE_WORKING_DIR`.

## Quyết định thiết kế

- **File-based IPC thay vì stdin/stdout**: Engine binary là C++ app không hỗ trợ JSON-RPC trên stdio. File IPC dễ debug hơn (có thể đọc request/response).
- **chokidar watch**: Polling không hiệu quả trên Windows. Chokidar dùng `ReadDirectoryChangesW` API -- phản hồi gần như real-time.
- **SHA1 checksum**: Verify tính toàn vẹn của engine binary trước khi giải nén -- tránh corrupt file do download lỗi.
- **`resolvePackageRoot()` walk-up algorithm**: `__dirname` thay đổi sau tsup bundle. Walk-up tìm `node_modules/playwright-core` -- up tối đa 10 levels.
- **`CLOSE_TIMEOUT`**: Graceful kill (`SIGTERM`) -> đợi `CLOSE_TIMEOUT` (ms) -> force kill (`taskkill /T /F`). Windows process tree cần `/T` flag.

## Lưu ý

- `DEFAULT_TIMEOUT` = 300s cho cả engine start và request -- có thể config riêng qua `setRequestTimeout()` và `setEngineTimeout()`.
- Cache metadata trong `meta.json` -- tránh download lại mỗi lần start.
- Events `beforeDownload` và `beforeExtract` emit để UI hiển thị tiến trình.
- `kill()` safe multi-call -- kiểm tra `this.process` trước khi kill.

## Tài liệu liên quan

- `docs/designs/remote-engine.design.md`
- `docs/specs/remote-engine.spec.md`
- `docs/plans/remote-engine.plan.md`
- `docs/products/remote-engine.product.md`
- `src/plugin/connector/engine.ts`
