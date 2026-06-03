# Spec: Test Connector (RemoteEngine + Connector + PCAP)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Viết unit test cho ba module trong `src/plugin/connector/`: `engine.ts` (RemoteEngine), `index.ts` (Connector), và `pcapServer/index.ts` (PCAP server). Test được tổ chức trong một file duy nhất: `tests/connector.test.ts`. Phương pháp hybrid: PCAP server test với TCP thật, RemoteEngine và Connector test với dependencies được mock.

Tham chiếu design: `docs/designs/test-connector.design.md`

## Yêu cầu

- PCAP server: test listen/close, xử lý lệnh binary, EADDRINUSE retry.
- RemoteEngine: test constructor/setters, `runFunction()` với mock IPC, `kill()`, helpers (`download`, `checksum`, `exists`).
- Connector: test `api()` với error normalization (MissingKeyError, PluginError), lazy init PCAP, `cleanup()`.
- Test dùng `mocha` + `node:assert`, không thêm thư viện mock (sinon, proxyquire).
- Mock thủ công: override module-level dependencies qua dynamic `import()` + `delete require.cache`.
- Integration test với engine thật `it.skip` — triển khai sau.

## Thiết kế

### Cấu trúc file test

```
tests/connector.test.ts
├── PCAP Server (describe)
│   ├── listen()
│   ├── close()
│   ├── request ID (0x01)
│   ├── heartbeat (0x07)
│   └── EADDRINUSE retry
├── RemoteEngine (describe)
│   ├── constructor + setters
│   ├── helpers (exists, checksum, download)
│   ├── runFunction()
│   └── kill()
└── Connector (describe)
    ├── constructor
    ├── api() - thành công
    ├── api() - MissingKeyError
    ├── api() - PluginError
    ├── api() - perfectCanvasRequest
    └── cleanup()
```

### Mock strategy

| Module | Dependency | Cách mock |
|---|---|---|
| **RemoteEngine** | `axios` | Dynamic import + override: `await import()` rồi set `axios.get = () => ...` |
| | `chokidar` | Tạo file temp thật + watch chokidar thật cho `runFunction()` |
| | `child_process.execFile` | Override `execFile` trả về EventEmitter với PID giả |
| | `fs` (download/checksum) | Dùng thật với temp directory |
| **Connector** | `RemoteEngine` | Override class: `RemoteEngine.prototype.runFunction = () => ...` |
| | `pcapServer` | Clear module cache + dynamic re-import sau khi set mock |

### Xử lý module-level `initPromise`

Vì `initPromise` là `let` ở module scope của `connector/index.ts`, không export được, cách tiếp cận:

1. Trong `beforeEach`, dùng `delete require.cache` cho connector module.
2. Dynamic `import()` lại connector để có instance mới với `initPromise = undefined`.
3. Mock `pcapServer.listen` và `pcapServer.close` trước khi dynamic import connector.

Pattern cụ thể:

```ts
// Trong describe('Connector')
beforeEach(() => {
  // Clear cache để reset initPromise
  for (const key of Object.keys(require.cache)) {
    if (key.includes('connector') || key.includes('pcapServer')) {
      delete require.cache[key];
    }
  }
});
```

## API / Data flow

### PCAP Server

```
Client (net.Socket) → gửi [0x01, ...] → PCAP Server → phản hồi [0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, <id:4byte>]
Client (net.Socket) → gửi [0x07, ...] → PCAP Server → phản hồi [0x07, 0x00, 0x00, 0x00, 0x00]
```

### RemoteEngine IPC

```
runFunction(name, params)
  → #updateMeta() — đọc project.xml, fetch metadata (mock axios)
  → #startProcess() — spawn FastExecuteScript.exe (mock execFile)
  → tạo request JSON file
  → chokidar watch file change (mock chokidar hoặc dùng thật)
  → đọc response JSON
  → xoá request file
  → parse & return FunctionResult
```

### Connector

```
api(name, params)
  → #ensurePcapPort() — lazy init PCAP server
  → #engine.setArgs([`--mock-pcap-port=${port}`])
  → async-lock.acquire('client', ...)
    → #engine.runFunction(name, params)
    → normalize error:
      - 'key is missing'  → MissingKeyError + notify()
      - error khác        → PluginError
      - success           → result.response ?? result
```

## Components

- **Tạo mới:** `tests/connector.test.ts` — file test duy nhất cho cả 3 module.
- **Không sửa code nguồn** — test chỉ dùng dynamic import + override prototype, không thay đổi production code.

## Xử lý lỗi

| Tình huống | Kết quả mong đợi |
|---|---|
| `download()` thất bại (network error) | File `.tmp` được xoá trong catch |
| `runFunction()` timeout | `RequestTimeoutError` |
| `#startProcess()` timeout | `EngineTimeoutError` |
| `api()` trả về error "key is missing" | `MissingKeyError` + `notify()` được gọi |
| `api()` trả về error khác | `PluginError` |
| `runFunction()` response parse fail | `{ error: 'Invalid response format from engine' }` |
| PCAP server port bận (EADDRINUSE) | Retry sau 1s |
| `kill()` process đã exit | No-op, không throw |

## Kiểm tra

### PCAP Server (6 test cases)

| Case | Input | Expected |
|---|---|---|
| listen thành công | random port | Trả về port number > 0 |
| request ID (0x01) | Gửi buffer `[0x01]` | Response đúng format: header + id |
| heartbeat (0x07) | Gửi buffer `[0x07]` | Response heartbeat `[0x07, 0x00, 0x00, 0x00, 0x00]` |
| data rỗng | Gửi buffer rỗng `[]` | Không crash, ignore |
| close | Gọi `close()` | Server dừng, không listen nữa |
| EADDRINUSE | Listen port đã dùng | Retry + thành công ở lần 2 |

### RemoteEngine (12 test cases)

| Case | Input | Expected |
|---|---|---|
| Constructor defaults | Không options | `#cwd = CWD`, `#requestTimeout = DEFAULT_TIMEOUT` |
| SetCwd | `/tmp/test` | `#cwd` được set |
| SetArgs | `['--debug']` | `#args` được set |
| SetEngineTimeout | `60000` | `#engineTimeout = 60000` |
| SetRequestTimeout | `30000` | `#requestTimeout = 30000` |
| exists — file tồn tại | Path temp file | `true` |
| exists — file không tồn tại | Path không có | `false` |
| checksum | Temp file với nội dung | SHA1 hex string đúng |
| download — thành công | URL + file path | File được tạo, nội dung đúng |
| download — HTTPS fail fallback HTTP | URL HTTPS fail | Fallback thành công HTTP |
| download — thất bại cleanup | URL lỗi | File `.tmp` không còn tồn tại |
| kill — process đang chạy | Mock ChildProcess | `proc.kill()` được gọi, `#process = undefined` |
| kill — process đã killed | `killed = true` | Không gọi `kill()`, không throw |

### Connector (7 test cases)

| Case | Input | Expected |
|---|---|---|
| Constructor | options | Options được truyền xuống RemoteEngine |
| api — thành công | `name: 'test'` | Trả về response |
| api — key is missing | error: 'key is missing' | Throw MissingKeyError |
| api — error khác | error: 'unknown' | Throw PluginError |
| api — perfectCanvasRequest | `perfectCanvasRequest: true` | `requestTimeout = 0` |
| api — async-lock | 2 concurrent calls | Chỉ một request được xử lý tại một thời điểm |
| cleanup | — | `engine.kill()` được gọi |
