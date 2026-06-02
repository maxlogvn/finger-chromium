# Spec: RemoteEngine

## Mô tả

RemoteEngine quản lý vòng đời của `FastExecuteScript.exe` -- engine binary từ bablosoft. Nó tự động tải, giải nén, cấu hình, spawn, và giao tiếp với engine qua file-based IPC.

## API / Interfaces chính

### `RemoteEngine` class

```ts
class RemoteEngine extends EventEmitter {
  constructor(options?: EngineOptions);

  // Cấu hình
  setCwd(value?: string): void;        // Thư mục làm việc (mặc định: process.cwd()/data)
  setArgs(value?: string[]): void;     // Tham số dòng lệnh
  setEngineTimeout(value?: string | number): void;  // Timeout download+extract+spawn
  setRequestTimeout(value?: string | number): void; // Timeout IPC request

  // Core method
  runFunction(name: string, params: unknown, options?: RunFunctionOptions): Promise<FunctionResult>;

  // Sự kiện
  // 'beforeDownload' → khi bắt đầu download
  // 'beforeExtract'  → khi bắt đầu extract
}
```

### `EngineOptions`

```ts
interface EngineOptions {
  cwd?: string;                // Thư mục làm việc
  args?: string[];             // Tham số engine
  engineTimeout?: string | number;  // ms, mặc định: 300000
  requestTimeout?: string | number; // ms, mặc định: 300000
}
```

### `FunctionResult`

```ts
interface FunctionResult {
  error?: string;
  response?: unknown;
  [key: string]: unknown;
}
```

## Luồng dữ liệu

### 1. `runFunction(name, params)` -- gọi hàm trên engine

```
runFunction(name, params)
    │
    ├── Chưa có metadata? → #updateMeta()
    │       ├── Đọc project.xml → lấy <EngineVersion>
    │       ├── Fetch metadata từ bablosoft.com
    │       └── Cache vào file <version>_<ARCH>.json
    │
    ├── #startProcess(engineTimeout)
    │       ├── Kiểm tra checksum SHA1 của zip
    │       │   └── Sai? → xoá engine cũ
    │       ├── Download zip nếu chưa có
    │       │   └── Emit 'beforeDownload'
    │       ├── Extract zip nếu chưa có
    │       │   └── Emit 'beforeExtract'
    │       ├── Copy project.xml + settings.ini + worker_command_line.txt
    │       └── Spawn FastExecuteScript.exe
    │
    ├── Tạo thư mục r/ (nếu chưa có)
    │
    ├── Dọn request cũ: kiểm tra PID, xoá file của process đã chết
    │
    ├── Ghi file: r/<pid>_<uuid>.json = JSON.stringify({ name, params })
    │
    ├── Watch file bằng chokidar, đợi engine ghi đè
    │   ├── Timeout? → reject RequestTimeoutError
    │   ├── Process close? → đợi CLOSE_TIMEOUT (60s) rồi resolve rỗng
    │   └── File change? → đọc nội dung, unlink file, resolve
    │
    └── Parse JSON response → trả về FunctionResult
```

### 2. `#updateMeta()` -- lấy metadata engine

```
Đọc project.xml → parse <EngineVersion> → version
    │
    ├── Cache tồn tại? → đọc file JSON
    └── Cache không tồn tại?
        ├── Fetch từ: http://bablosoft.com/distr/.../<version>.meta.json
        ├── Parse: { Checksum, Url }
        ├── Lưu cache vào: <cwd>/<version>_<ARCH>.json
        └── Set this.#meta
```

### 3. `#startProcessInternal()` -- spawn engine

```
Kiểm tra engineDir (có chứa zip không)
    │
    ├── Có zip? → SHA1 checksum → khớp? → giữ
    │                           → không khớp? → xoá engineDir
    │
    └── Không có engineDir? → download zip
        │
        ▼
    Kiểm tra scriptDir (đã extract chưa?)
    │
    ├── Chưa extract? → extract zip → copy config files
    └── Đã extract? → bỏ qua
        │
        ▼
    Spawn: execFile('FastExecuteScript.exe', ['--silent', ...args], { cwd: scriptDir })
```

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/connector/engine.ts` | RemoteEngine class (373 dòng) |
| `src/plugin/connector/utils.ts` | Hàm helper (notify, thuộc API Connector, không dùng trong RemoteEngine) |
| `src/plugin/connector/index.ts` | API Connector (singleton + wrapper) |
| `project.xml` | File cấu hình engine BAS (chứa EngineVersion) |

## Xử lý lỗi

| Lỗi | Nơi throw | Nguyên nhân |
|---|---|---|
| `EngineTimeoutError` | `#startProcess(timeout)` khi Promise.race timeout | Download/extract/spawn quá lâu |
| `InvalidEngineError` | `execFile` callback lỗi | Engine binary không chạy được |
| `RequestTimeoutError` | `runFunction` khi setTimeout reject | Engine không phản hồi kịp |
| Error('[RemoteEngine] Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.') | `resolvePackageRoot` | package.json không có name đúng |
| Error('Không thể đọc phiên bản Engine từ project.xml') | `#updateMeta` | project.xml không có EngineVersion |

## Ghi chú kỹ thuật

- **Đường dẫn tuyệt đối:** `PROJECT_PATH` được resolve bằng cách đi ngược từ `__dirname` cho đến khi tìm thấy `package.json` có `name === 'fingerprint-chromium-engine'`. Điều này đảm bảo đúng ngay cả khi code được bundle vào dist/.
- **Chokidar watch:** Dùng `awaitWriteFinish: true` để tránh đọc file khi engine chưa ghi xong.
- **Timeout cấu hình:** Có thể set qua `FINGERPRINT_TIMEOUT` env (ms) hoặc qua method `setEngineTimeout`/`setRequestTimeout`.
- **Kiểm tra PID còn sống:** Dùng `process.kill(pid, 0)` -- ném `ESRCH` nếu process không tồn tại.
- **Random UUID trong tên file:** Tránh conflict khi nhiều request cùng PID.

---
