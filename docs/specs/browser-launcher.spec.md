# Spec: Browser Launcher

## Mô tả

Browser Launcher spawn Chromium process và phát hiện DevTools listening URL. Nó cung cấp `Browser` interface với `close()` và `configure()` methods.

## API / Interfaces chính

### `launch(options)`

```ts
const launch = async (options?: LaunchOptions): Promise<Browser>
```

| Tham số | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `args` | `string[]` | `[]` | Arguments cho Chromium |
| `timeout` | `number` | `30000` | Timeout chờ DevTools URL (ms) |
| `userDataDir` | `string` | `''` | Thư mục profile |
| `debuggingPort` | `number` | `0` | Port debugging (0 = random) |
| `executablePath` | `string` | `''` | Đường dẫn Chromium executable |

### `Browser` interface

```ts
interface Browser {
  process: ChildProcess;     // Chromium child process
  port: number;              // DevTools debugging port
  url: string;               // DevTools WebSocket URL
  configure(): Promise<void>; // Configure browser (hiện tại là no-op)
  close(): Promise<void>;     // Kill browser process tree
}
```

## Luồng dữ liệu

```
launch({ args, timeout, userDataDir, debuggingPort, executablePath })
    │
    ├── Tạo resolvedArgs: nếu có userDataDir → thêm --user-data-dir
    │
    ├── spawn(executablePath, [...args, `--remote-debugging-port=${port}`])
    │
    ├── Parse stderr/stdout từng dòng bằng readline
    │   ├── Tìm "DevTools listening on <url>"
    │   ├── Timeout? → reject Error
    │   └── Có match? → clear timeout, resolve URL
    │
    ├── Parse port từ URL (new URL(url).port)
    │
    └── Return { process, port, url, close, configure }
```

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/launcher/index.ts` | Browser launcher (99 dòng) |

## Xử lý lỗi

| Lỗi | Nguyên nhân |
|---|---|
| `Timed out after ${timeout}ms while trying to launch the browser.` | Chromium không in DevTools URL trong thời gian timeout |
| `exec taskkill` lỗi | Không kill được process (fallback về childProcess.kill()) |

## Ghi chú kỹ thuật

- `readline.createInterface` được tạo trên cả `childProcess.stderr` và `childProcess.stdout`.
- `timeout` mặc định 30 giây.
- `close()` dùng `taskkill /pid <pid> /T /F` -- Windows-specific. Nếu lỗi, fallback về `childProcess.kill()`.
- `configure()` hiện tại là no-op (`async () => {}`) -- dành cho custom configuration sau này.

---
