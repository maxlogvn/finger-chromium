# Spec: Test coverage cho `runFunction()` IPC core (Issue #28)

> Non-feature task — test coverage cho phương thức IPC duy nhất.

## Mô tả

Viết unit test cho phương thức `runFunction()` trong `src/plugin/connector/engine.ts:234-314` — cơ chế IPC duy nhất giao tiếp với engine binary. Hiện tại không có test nào gọi `runFunction()` (zero coverage trên critical path). Dùng cơ chế override `child_process.execFile` + temp directory để bypass download/extract engine thật, test IPC flow thật (chokidar watch, JSON read/write, timeout).

Tham chiếu design: `docs/designs/test-runfunction-ipc-core.design.md`

## Yêu cầu

- Sửa production code tối thiểu — thêm 2 static properties (`_execFile`, `_closeTimeout`) vào `RemoteEngine` để bypass ESM live binding immutable. Không thay đổi logic production.
- Test IPC flow thật: file-based IPC (chokidar + JSON request/response).
- Chạy được offline, không cần network hay key.
- Bypass `#updateMeta()` (private) bằng cache file trong temp dir.
- Bypass `#startProcessInternal()` bằng override `execFile` + cây thư mục engine giả.
- Thêm test vào file hiện có: `tests/connector.test.ts` (mở rộng describe('RemoteEngine')).

## Thiết kế

Xem design doc: `docs/designs/test-runfunction-ipc-core.design.md`

Tóm tắt:

1. **Bypass #updateMeta()**: Set cwd=tempDir, tạo cache `{tempDir}/{version}_{ARCH}.json` trước khi gọi `runFunction()`.
2. **Bypass #startProcessInternal()**: Tạo `engine/{version}/` (dir rỗng) + `script/{version}/FastExecuteScript.exe` (file rỗng) trong tempDir. Override `child_process.execFile` trả về mock EventEmitter.
3. **Simulate engine response**: Poll `r/` directory cho đến khi request file xuất hiện, ghi response JSON để kích hoạt chokidar 'change' event.

### Cấu trúc test

```
tests/connector.test.ts
├── PCAP Server (5 tests) — giữ nguyên
├── RemoteEngine (describe)
│   ├── constructor + setters (7 tests) — giữ nguyên
│   ├── helpers (5 tests) — giữ nguyên
│   ├── runFunction() (5-6 tests MỚI)
│   │   ├── thành công
│   │   ├── timeout
│   │   ├── invalid JSON
│   │   ├── process đóng
│   │   └── dọn file rác
│   └── kill() (3 tests) — giữ nguyên
└── Connector (7 tests) — giữ nguyên
```

### Deviations từ design

| Design | Thực tế | Lý do |
|--------|---------|-------|
| Override `child_process.execFile` | Override `RemoteEngine._execFile` | ESM live binding immutable — không thể override built-in module function qua namespace import |
| `CLOSE_TIMEOUT` (60s) không đổi | Override `RemoteEngine._closeTimeout = 100` | Không thể chờ 60s trong test |
| `simulateResponse` dùng `JSON.stringify` | Thêm `raw` flag để ghi raw string | `JSON.stringify('not-json')` tạo valid JSON string literal |
| Không sửa production code | Thêm 2 static properties `_execFile`, `_closeTimeout` | Bắt buộc để bypass ESM limitations |

### Mock strategy

| Dependency | Cách mock | Phạm vi |
|---|---|---|---|
| `child_process.execFile` | Override `RemoteEngine._execFile` (static property) trả về mock EventEmitter | Trong từng test case, restore sau |
| `CLOSE_TIMEOUT` | Override `RemoteEngine._closeTimeout` (static property) để rút ngắn thời gian chờ | Trong từng test case, restore sau |
| `fs` (read/write) | Dùng thật với temp directory | Toàn bộ test |
| `chokidar` | Dùng thật — watch file thật trong temp dir | Toàn bộ test |
| `project.xml` | Dùng file thật ở `PROJECT_PATH` | Toàn bộ test |
| Engine metadata cache | Tạo file `{version}_{ARCH}.json` trong temp dir | Trước mỗi test case |

### Bypass chain cụ thể

```
Input: new RemoteEngine({ cwd: tempDir, requestTimeout })
  → engine.setRequestTimeout(100)  // cho test timeout nhanh
  → engine.runFunction('testFunc', { foo: 'bar' })

Trong runFunction():
  → #updateMeta()
      → fs.readFile(PROJECT_PATH)           ← file thật, ok
      → regex match version = "29.9.2"
      → tìm cache {tempDir}/29.9.2_64.json  ← file ta tạo, ok
      → this.#meta = parsed cache
  → #startProcess(engineTimeout)
      → #isProcessAlive → false (chưa có process)
      → #startProcessInternal()
          → tạo scriptDir = {tempDir}/script/29.9.2/
          → tạo engineDir = {tempDir}/engine/29.9.2/
          → zipPath = {engineDir}/FastExecuteScript.x64.zip
          → exists(zipPath) → false (ta không tạo)
          → exists(engineDir) → true (ta tạo rồi) → skip download
          → exists(scriptDir) → true (ta tạo rồi) → skip extract
          → copy project.xml, write worker_command_line.txt, settings.ini
           → RemoteEngine._execFile(path.join(scriptDir, 'FastExecuteScript.exe'), ...)
               → override trả về mock EventEmitter
           → return mockProc
  → requestDir = path.dirname(mockProc.spawnfile) + '/r'
  → cleanup old request files
  → tạo request file: {requestDir}/99999_{uuid}.json
  → chokidar.watch(requestFile)
  → await change event
```

## API / Data flow

### Input

```
runFunction('testFunc', { foo: 'bar' }, { requestTimeout: 5000 })
```

### Request file format

```json
{ "name": "testFunc", "params": { "foo": "bar" } }
```

Ghi tại `{scriptDir}/r/99999_{randomUUID}.json`.

### Response file format

Engine ghi đè nội dung request file với response:

```json
{ "response": { "ok": true }, "error": null }
```

hoặc:

```json
{ "error": "some error message" }
```

### Output

Hợp lệ: `FunctionResult` (`{ error?: string, response?: unknown, ... }`).
Lỗi timeout: throw `RequestTimeoutError`.
Lỗi parse: `{ error: 'Invalid response format from engine' }`.
Process đóng: `{ error: 'Engine process closed unexpectedly' }`.

## Components

- **Tạo mới:** Không — mở rộng `tests/connector.test.ts` với describe `runFunction()` mới trong `RemoteEngine`.
- **Sửa đổi:** Không — không chạm production code.

## Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| `execFile` mock thiếu properties | Test fail với TypeError rõ ràng |
| Poll không tìm thấy request file kịp | Timeout trong test helper |
| Chokidar không detect change | Kiểm tra awaitWriteFinish timing |
| Temp dir cleanup fail | `fs.rm` với `force: true` trong `afterEach` |
| `_execFile` override ảnh hưởng test khác | Restore trong `afterEach` |
| `_closeTimeout` override ảnh hưởng test khác | Restore trong `afterEach` |

## Kiểm tra

### Test cases (6 tests)

| # | Case | Mock setup | Hành vi | Expected |
|---|------|-----------|---------|----------|
| 1 | Thành công — parse response đúng | `_execFile` → mockProc | Ghi response `{"response":{"ok":true}}` vào request file | `result.response.ok = true` |
| 2 | Timeout — requestTimeout hết hạn | `_execFile` → mockProc | Không ghi response, `requestTimeout=100` | `RequestTimeoutError` |
| 3 | Invalid JSON — response không parse được | `_execFile` → mockProc | Ghi `not-json` raw vào request file (dùng `raw=true`) | `{error: 'Invalid response format from engine'}` |
| 4 | Process đóng — engine exit trước khi response | `_execFile` → mockProc, `_closeTimeout=100` | Emit 'close' trên mockProc, không ghi response | `{error: 'Engine process closed unexpectedly'}` |
| 5 | Dọn file rác — xoá request file cũ | `_execFile` → mockProc, pre-create `88888_old.json` trong `r/` | `#startProcess` gọi cleanup logic | File `88888_old.json` bị xoá sau khi runFunction hoàn thành |
| 6 | `requestTimeout=0` — không timeout | `_execFile` → mockProc | Ghi response sau 50ms | Chờ thành công, timeout không được set |

### Edge cases

| Case | Detail |
|---|---|
| randomUUID trùng | Khả năng cực thấp, ignore |
| Chokidar emit change nhiều lần | runFunction chỉ resolve một lần nhờ Promise |
| File đã tồn tại trong `r/` từ test trước | Clean trong beforeEach |
| Temp dir permission error | Test fail với message rõ |

### Không test trong scope này

| Case | Lý do | Link |
|---|---|---|
| engineTimeout | Liên quan #startProcess timeout, không phải IPC | — |
| Concurrent calls | Thuộc Connector.async-lock | Issue #31 |
| EADDRINUSE retry | Thuộc PCAP server | Issue #29 |
| HTTPS fallback download | Thuộc download() | Issue #30 |
