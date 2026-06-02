# Spec: Browser Launcher

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Module spawn Chromium child process (`worker.exe`), phát hiện DevTools listening URL từ output, và trả về `Browser` object để quản lý vòng đời process. Đây là lớp thấp nhất trong chuỗi launch — sau khi `FingerprintPlugin` cấu hình engine, nó dùng launcher này để thực sự mở browser.

Source: `src/plugin/launcher/index.ts` (99 dòng).

## Yêu cầu

- Spawn executable với arguments + `--remote-debugging-port=<port>`.
- Parse DevTools URL từ dòng `DevTools listening on <url>` trong stderr hoặc stdout.
- `close()` kill toàn bộ process tree bằng `taskkill /pid <pid> /T /F` (Windows).
- `configure()` là no-op (tương thích interface `Browser`).
- Timeout configurable (mặc định 30 giây) — nếu không phát hiện URL trong thời gian này, reject.
- Trả về `Browser` object với: `process`, `port`, `url`, `close()`, `configure()`.

## Thiết kế

### Luồng launch

```
launch({ executablePath, debuggingPort, args, timeout })
  │
  ├─ spawn(executablePath, [...args, --remote-debugging-port=<port>])
  │
  ├─ Promise race:
  │    ├─ stderr/stdout line event → regex match "DevTools listening on <url>"
  │    │    → clearTimeout → resolve(url)
  │    └─ timeout → reject(Error)
  │
  ├─ Parse port từ URL: new URL(url).port
  │
  └─ Return Browser object
       ├─ url, port, process
       ├─ close() → taskkill /pid /T /F (fallback childProcess.kill())
       └─ configure() → no-op
```

Tham chiếu design doc: `docs/designs/browser-launcher.design.md`.

## API / Data flow

```ts
import { launch } from '../../plugin/launcher';
import type { LaunchOptions, Browser } from '../../plugin/launcher';

const browser: Browser = await launch({
  executablePath: './worker.exe',
  debuggingPort: 9222,
  args: ['--parent-process-id=12345', '--unique-process-id=abc'],
  timeout: 30000,
});

console.log(browser.url);    // "http://127.0.0.1:9222"
console.log(browser.port);   // 9222
console.log(browser.process.pid); // PID worker.exe

await browser.close();       // taskkill /pid /T /F
await browser.configure();   // no-op
```

### Input — LaunchOptions

| Field | Type | Default | Mô tả |
|---|---|---|---|
| `executablePath` | `string` | `''` | Đường dẫn đến worker.exe |
| `debuggingPort` | `number` | `0` | Port CDP (0 = random) |
| `args` | `string[]` | `[]` | Tham số dòng lệnh |
| `timeout` | `number` | `30000` | Timeout chờ DevTools URL (ms) |
| `userDataDir` | `string` | `''` | Profile path — tự động thêm `--user-data-dir` |
| `headless` | `boolean` | — | Không dùng (engine ép headless: false) |

### Output — Browser

| Field | Type | Mô tả |
|---|---|---|
| `process` | `ChildProcess` | Process worker.exe |
| `port` | `number` | Port CDP |
| `url` | `string` | DevTools URL |
| `close()` | `() => Promise<void>` | Kill process tree |
| `configure()` | `() => Promise<void>` | No-op |

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/launcher/index.ts` | `launch()` function + `Browser` interface | 99 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Process không in DevTools URL trong `timeout` ms | Reject với `Error('Timed out after ...ms while trying to launch the browser.')` |
| `executablePath` không tồn tại | Spawn throw `ENOENT` |
| `close()` — `taskkill` fail | Fallback `childProcess.kill()` + force set `killed = true` |
| `URL()` parse fail (URL không hợp lệ) | Throw `TypeError` từ `new URL()` |

## Kiểm tra

- Happy path: spawn worker.exe → parse URL → trả Browser object → close thành công.
- Edge case: process in URL ở stderr thay vì stdout — vẫn parse được.
- Error: timeout 1ms với process không in URL → throw timeout.
- Error: executablePath không hợp lệ → spawn throw.
- Close: `close()` gọi `taskkill` với PID đúng.
- Close gọi nhiều lần: lần 2 không lỗi (kiểm tra `killed`).
