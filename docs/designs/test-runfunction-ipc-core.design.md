# Design: Test coverage cho `runFunction()` IPC core (Issue #28)

> Non-feature task — viết test coverage cho phương thức IPC duy nhất giao tiếp với engine binary.

## Bối cảnh

`runFunction()` trong `src/plugin/connector/engine.ts:234-314` là phương thức IPC duy nhất để giao tiếp với engine binary (`FastExecuteScript.exe`) qua file-based IPC. Hiện tại không có test nào gọi `runFunction()` dù trực tiếp hay gián tiếp — zero coverage trên critical path.

Vấn đề: `runFunction()` phụ thuộc vào private fields `#process` và `#meta` (JS native private, không thể mock từ ngoài), và gọi `#startProcessInternal()` có side effects nặng (download engine, giải nén, spawn process thật).

## Câu hỏi làm rõ

- Làm sao bypass `#updateMeta()` để không fetch từ bablosoft? → Tạo cache file `{cwd}/{version}_{ARCH}.json` trước khi gọi `runFunction()`.
- Làm sao bypass `#startProcessInternal()` để không download/extract engine? → Tạo cây thư mục tối thiểu giả lập engine đã được cài đặt, override `execFile` trả về mock ChildProcess.
- Có sửa production code không? → Không. Mock hoàn toàn từ test (override `child_process.execFile` + tạo temp directory).

## Các phương án

### Phương án 1: Override `child_process.execFile` + temp directory (Recommended)

Tạo cây thư mục tối thiểu trong temp dir để bypass download/extract engine, override `child_process.execFile` trả về mock ChildProcess. `runFunction()` chạy real: chokidar watch thật, JSON read/write thật.

- Ưu điểm: Không sửa production code, test real IPC flow (chokidar + file system).
- Nhược điểm: Cần tạo nhiều file/directory trong temp, phụ thuộc vào cấu trúc nội bộ của `#startProcessInternal()`.

### Phương án 2: Extract IpClient class

Refactor nhẹ: tách file-based IPC thành class riêng, `runFunction()` gọi `IpClient.call()`. Test `IpClient` độc lập với file thật.

- Ưu điểm: Dễ maintain hơn, test focused hơn.
- Nhược điểm: Phải sửa production code (thay đổi file nguồn chính).

### Phương án 3: Integration test với engine thật

Test với engine thật cần `BABLOSOFT_KEY` + network. Dùng `it.skip` nếu không có key.

- Ưu điểm: Coverage thật nhất.
- Nhược điểm: Chậm, fragile, require key, không chạy được trong CI.

## Giải pháp được chọn

- **Phương án được chọn:** Phương án 1 — Override `child_process.execFile` + temp directory.
- **Lý do:** Không sửa production code, test được IPC flow thật (chokidar + file system), có thể chạy offline.
- **Ràng buộc:** Cần biết engine version từ `project.xml` (`<EngineVersion>29.9.2</EngineVersion>`) để tạo đường dẫn thư mục đúng.

## Chi tiết giải pháp

### Bypass `#updateMeta()`

`#updateMeta()` đọc `PROJECT_PATH` (thật) để lấy version, sau đó kiểm tra cache tại `{cwd}/{version}_{ARCH}.json`:

```
B1: Set cwd = tempDir
B2: Tạo file {tempDir}/29.9.2_64.json với nội dung:
    { "checksum": "fake", "url": "http://fake/fake.zip", "version": "29.9.2" }
B3: #updateMeta() tìm thấy cache → không fetch bablosoft
```

### Bypass `#startProcessInternal()`

`#startProcessInternal()` kiểm tra engineDir tồn tại (→ skip download), scriptDir tồn tại (→ skip extract), rồi gọi `execFile`:

```
B1: Tạo {tempDir}/engine/29.9.2/           (dir rỗng)
B2: Tạo {tempDir}/script/29.9.2/            (dir rỗng)
B3: Tạo {tempDir}/script/29.9.2/FastExecuteScript.exe  (file rỗng)
B4: Override child_process.execFile → trả về mock EventEmitter
B5: #startProcessInternal() chạy: check → skip download → skip extract → execFile → mock returned
```

### Mock ChildProcess

```ts
const mockProc = new EventEmitter();
(mockProc as any).pid = 99999;
(mockProc as any).spawnfile = path.join(scriptDir, 'FastExecuteScript.exe');
(mockProc as any).killed = false;
(mockProc as any).exitCode = null;
(mockProc as any).kill = function () { this.killed = true; };
```

### IPC test flow

```
Test gọi runFunction('testFunc', { foo: 'bar' })
  → #updateMeta() dùng cache → ok
  → #startProcessInternal() bypass → return mockProc
  → Tạo request file: {scriptDir}/r/99999_{random}.json ← ghi { name, params }
  → Chokidar.watch(requestFile) với awaitWriteFinish: true
  → Test poll r/ directory cho đến khi tìm thấy file 99999_*.json
  → Test ghi response JSON vào file đó
  → Chokidar 'change' event → read file → parse → resolve
  → runFunction() trả về FunctionResult
```

### Test cases

| # | Case | Cách kích hoạt | Expected |
|---|------|----------------|----------|
| 1 | Thành công | Ghi response `{"response": {"ok": true}}` | `result = {response: {ok: true}}` |
| 2 | Timeout | Không ghi response, `requestTimeout=100` | `RequestTimeoutError` |
| 3 | Invalid JSON | Ghi response không parse được | `{error: 'Invalid response format from engine'}` |
| 4 | Process đóng | Emit 'close' trên mock process, không ghi response | `{error: 'Engine process closed unexpectedly'}` |
| 5 | Dọn file rác | Pre-create file `88888_old.json` trong `r/`, PID 88888 không tồn tại | File cũ bị xoá, request mới tạo được |

### Không test (scope exclusion)

- engineTimeout: Liên quan đến `#startProcess()` timeout, không phải IPC flow.
- Concurrent calls: Thuộc về Connector.async-lock (Issue #31).
- `#isProcessAlive()` cache: Đã test gián tiếp qua `#startProcess()` flow.
