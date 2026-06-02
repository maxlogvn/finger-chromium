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

### runFunction(name, params)

1. Update metadata nếu chưa có
2. Start process nếu chưa chạy
3. Tạo request file `r/<pid>_<uuid>.json`
4. Cleanup request cũ (theo PID)
5. Watch file bằng chokidar
6. Đợi response (timeout + close event)
7. Parse JSON response, trả `{ error?, response? }`

## File structure của engine

```
data/
├── s/                  # Settings files (*.ini)
├── t/                  # Temp files
├── r/                  # Request files (*.json)
└── <version>/          # Engine version directory
    ├── FastExecuteScript.exe
    ├── project.xml
    └── worker_command_line.txt  # Nội dung: --mock-connector
```
