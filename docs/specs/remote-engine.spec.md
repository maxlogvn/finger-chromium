# Spec: RemoteEngine

## Class: RemoteEngine extends EventEmitter

### Private fields

| Field | Type | Mô tả |
|---|---|---|
| `#meta` | `EngineMeta?` | Metadata từ project.xml + bablosoft API |
| `#cwd` | `string` | Thư mục làm việc (default `CWD` = `data/`) |
| `#args` | `string[]` | Args cho engine binary |
| `#engineTimeout` | `number` | Timeout start (~300s default) |
| `#requestTimeout` | `number` | Timeout request (~300s default) |

### EngineMeta type

```ts
interface EngineMeta {
  version: string;   // Từ project.xml <EngineVersion>
  checksum: string;  // SHA1 từ metadata JSON
  url: string;       // Download URL từ metadata JSON
}
```

### Hằng số

| Tên | Giá trị | Mô tả |
|---|---|---|
| `CLOSE_TIMEOUT` | `60000` | Thời gian chờ engine đóng |
| `DEFAULT_TIMEOUT` | `300000` | 5 phút |
| `ARCH` | `'32'` hoặc `'64'` | Từ process.arch |
| `CWD` | `'data/'` | Thư mục mặc định |
| `PROJECT_PATH` | `'...'` | Từ resolvePackageRoot |

### runFunction(name, params) -- Flow chi tiết

```
1. if (!meta) → #updateMeta()
2. if (!process) → #startProcess(timeout)
3. Tạo requests dir: r/
4. Cleanup request cũ:
   for each file in r/:
     pid = parsePidFromFilename(file)
     try kill(pid, 0) → nếu ESRCH → rm(file)
5. Request file: r/<process.pid>_<uuid>.json
   { name, params }
6. Watcher = chokidar.watch(requestFilePath, { awaitWriteFinish: true })
7. Promise.race([
     onWatcherChange → readFile → parse JSON → resolve({ response, error }),
     requestTimeout → reject(RequestTimeoutError),
     onProcessClose → setTimeout(CLOSE_TIMEOUT) → reject/retry
   ])
8. Finally: watcher.close(), rm(requestFilePath)
```

### Chi tiết timeout logic

```ts
// engineTimeout: Promise.race giữa startProcess và setTimeout
// requestTimeout: setTimeout reject trong Promise.race
// closeTimeout: 60s grace period khi process đóng bất ngờ
```

## File structure của engine

```
data/
├── s/                  # Settings files (*.ini)
├── t/                  # Temp files (PID-based lock files)
├── r/                  # Request files (*.json)
└── <version>/          # Engine version directory
    ├── FastExecuteScript.exe
    ├── project.xml
    └── worker_command_line.txt  # Nội dung: --mock-connector
```

## Engine initialization steps

| Bước | Method | Điều kiện | Action |
|---|---|---|---|
| Update meta | `#updateMeta()` | meta chưa load | Parse project.xml → fetch/cache metadata JSON |
| Checksum | `#startProcessInternal()` | Zip tồn tại | SHA1 hash zip → compare với meta.checksum → xoá nếu mismatch |
| Download | `#startProcessInternal()` | Engine dir missing | Download zip từ meta.url → verify SHA1 |
| Extract | `#startProcessInternal()` | Script dir missing | extract-zip → copy project.xml → tạo config files |
| Spawn | `#startProcessInternal()` | Engine ready | execFile('FastExecuteScript.exe', ['--silent', ...args]) |
