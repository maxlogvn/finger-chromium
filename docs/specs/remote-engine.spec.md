# Spec: RemoteEngine

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`RemoteEngine` quản lý toàn bộ vòng đời của engine binary (`FastExecuteScript.exe`). Đây là lớp thấp nhất trong stack — nó tải engine từ bablosoft.com, verify checksum SHA1, giải nén, spawn process, và giao tiếp qua file-based IPC.

Không có `RemoteEngine`, các lớp trên (`API Connector`, `FingerprintPlugin`) không thể gửi lệnh setup fingerprint hay nhận kết quả.

Source: `src/plugin/connector/engine.ts` (378 dòng).

## Yêu cầu

- Download engine từ bablosoft.com, verify SHA1 checksum.
- Cache metadata dưới dạng file `<version>_<ARCH>.json`.
- Extract zip vào thư mục `script/<version>/`.
- Copy `project.xml`, tạo `worker_command_line.txt`, `settings.ini`.
- File-based IPC: ghi JSON request file, `chokidar` watch phản hồi.
- Dọn dẹp request file cũ (process không còn tồn tại) trước mỗi request mới.
- Hỗ trợ win32 32-bit và 64-bit (ARCH auto-detection).
- Timeout configurable: `setEngineTimeout()`, `setRequestTimeout()`.
- `kill()` dừng engine process — an toàn khi gọi nhiều lần.
- Emit events: `beforeDownload`, `beforeExtract`.
- `resolvePackageRoot()` — walk-up algorithm để tìm package root sau tsup bundle.

## Thiết kế

### Class hierarchy

```
EventEmitter
  └── RemoteEngine
       ├── #meta: EngineMeta (cache)
       ├── #cwd: string
       ├── #args: string[]
       ├── #engineTimeout / #requestTimeout: number
       └── #process: ChildProcess
```

### Luồng runFunction()

```
runFunction(name, params, timeout)
 │
 ├─ #updateMeta() ─── đọc project.xml → fetch/cache metadata
 │
 ├─ #startProcess(timeout) ─── download → extract → spawn
 │    ├─ Nếu cần: download zip, verify checksum
 │    ├─ Nếu cần: extract zip
 │    ├─ Copy project.xml + tạo worker_command_line.txt + settings.ini
 │    └─ Spawn FastExecuteScript.exe
 │
 ├─ Tạo thư mục r/
 ├─ Dọn request file cũ (process không còn tồn tại)
 ├─ Ghi request file: { name, params }
 │
 ├─ chokidar watch request file → engine ghi response
 │    ├─ Có requestTimeout → reject nếu quá thời gian
 │    ├─ Engine process close → chờ CLOSE_TIMEOUT rồi resolve ''
 │    └─ File change → read, unlink, resolve
 │
 └─ Parse JSON response → trả FunctionResult
```

### File-based IPC chi tiết

Engine giao tiếp qua file JSON — không dùng pipe hay socket:

1. `runFunction()` tạo thư mục `r/` trong thư mục script engine.
2. Ghi file `<pid>_<uuid>.json` chứa `{ name, params }`.
3. `chokidar` watch file đó cho đến khi engine ghi response vào.
4. Đọc response, parse JSON, trả kết quả.
5. Dọn file request cũ trước mỗi request mới: kiểm tra PID còn sống không (signal 0). Nếu ESRCH (process không tồn tại) → xoá file.

Cơ chế file-based được chọn vì `FastExecuteScript.exe` (C/C++) không hỗ trợ stdin/stdout JSON protocol — file là cách đơn giản nhất để hai process giao tiếp.

Tham chiếu design doc: `docs/designs/remote-engine.design.md`.

## API / Data flow

```ts
const engine = new RemoteEngine({
  cwd: './data',
  engineTimeout: 300_000,
  requestTimeout: 300_000,
});

engine.on('beforeDownload', () => console.log('Downloading...'));
engine.on('beforeExtract', () => console.log('Extracting...'));

engine.setCwd('./custom/data');
engine.setArgs(['--mock-pcap-port=54321']);
engine.setEngineTimeout(300_000);
engine.setRequestTimeout(60_000);

const result = await engine.runFunction('setup', {
  key: 'abc',
  fingerprint: { value: '...' },
});

console.log(result.response);

engine.kill();
```

### Input / Output

- `runFunction(name, params, opts?)` → `Promise<FunctionResult>`.
- `kill()` → void.
- Các setter trả về void.

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/connector/engine.ts` | RemoteEngine class | 378 |
| `src/plugin/connector/index.ts` | class `Connector` — mỗi instance sở hữu `RemoteEngine` riêng | 123 |

## API methods

| Method | Mô tả |
|---|---|
| `setCwd(value?)` | Set thư mục làm việc. Mặc định: `process.cwd() + '/data'` |
| `setArgs(value?)` | Set tham số dòng lệnh cho engine |
| `setEngineTimeout(value?)` | Timeout khởi động engine (ms). Mặc định: `DEFAULT_TIMEOUT` (300s) |
| `setRequestTimeout(value?)` | Timeout chờ phản hồi (ms). Mặc định: `DEFAULT_TIMEOUT` (300s) |
| `get requestTimeout()` | Getter cho request timeout hiện tại |
| `runFunction(name, params, opts?)` | Gọi hàm trên engine qua file IPC |
| `kill()` | Kill process engine — kiểm tra `#process.killed` trước khi kill |

## Constants

| Tên | Giá trị | Mô tả |
|---|---|---|
| `CLOSE_TIMEOUT` | 60,000 ms | Chờ process engine đóng sau khi spawn (file-based IPC timeout) |
| `DEFAULT_TIMEOUT` | 300,000 ms (5 phút) | Timeout mặc định cho engine + request |
| `ARCH` | `'32'` hoặc `'64'` | Auto-detection: `process.arch.includes('32') ? '32' : '64'` |
| `CWD` | `process.cwd() + '/data'` | Thư mục làm việc mặc định |
| `PROJECT_PATH` | Walk-up resolved | Đường dẫn `project.xml` trong package root |

### Package Root Resolution

`resolvePackageRoot(startDir)` walk ngược từ `__dirname` đến khi tìm thấy `package.json` có `name === 'fingerprint-chromium-engine'`. Cần thiết vì sau tsup bundle, `__dirname` trong dist/ khác với source. Nếu không tìm thấy, throw error.

## Events

| Event | Khi nào emit | Dùng để |
|---|---|---|
| `beforeDownload` | Trước khi tải engine zip | Log progress cho user |
| `beforeExtract` | Trước khi giải nén engine | Log progress cho user |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `package.json` không tìm thấy (resolvePackageRoot) | Throw `PluginError('[RemoteEngine] Không tìm thấy thư mục gốc...')` |
| `project.xml` không đọc được | Throw `PluginError` từ `fs.readFile` |
| `project.xml` không có EngineVersion | Throw `InvalidEngineError('Không thể đọc phiên bản Engine...')` |
| Checksum không khớp | Xoá engine cũ (`fs.rm`), tải lại |
| Download thất bại | Axios throw — propagate lên connector |
| Extract thất bại | extract-zip throw — propagate |
| `startProcess` quá `engineTimeout` | Throw `EngineTimeoutError` |
| Spawn thất bại (exe không tồn tại, lỗi code) | Throw `InvalidEngineError` |
| `runFunction` chờ response quá `requestTimeout` | Throw `RequestTimeoutError` |
| Engine process close đột ngột | Chờ `CLOSE_TIMEOUT` ms, resolve rỗng |
| Response không phải JSON hợp lệ | Trả `{ error: 'Invalid response format from engine' }` |

## Kiểm tra

- Happy path: `runFunction('setup', {...})` → `{ response: ... }`.
- Edge case: checksum sai → xoá engine → tải lại → thành công.
- Edge case: request file cũ (process die) → tự động xoá.
- Error: request timeout → throw `RequestTimeoutError`.
- Error: engine startup timeout → throw `EngineTimeoutError`.
- Error: spawn fail → throw `InvalidEngineError`.
- Events: `beforeDownload`, `beforeExtract` emit đúng lúc.
- Kill: gọi `kill()` khi không có process → không throw.
