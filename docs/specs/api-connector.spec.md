# Spec: API Connector

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

API Connector là lớp trung gian singleton duy nhất giữa `FingerprintPlugin` (gọi lệnh) và `RemoteEngine` (thực thi). Nó dùng `async-lock` để đồng bộ — chỉ một request được xử lý tại một thời điểm — và tự động chuẩn hoá lỗi từ engine thành `MissingKeyError` hoặc `PluginError`.

Connector không tự khởi tạo engine. `RemoteEngine` được tạo một lần ở module level. PCAP server cũng tự động start khi connector được import, vì engine cần kết nối TCP để đồng bộ ID request.

Source: `src/plugin/connector/index.ts` (99 dòng).

## Yêu cầu

- Singleton `RemoteEngine` instance — dùng chung toàn bộ thư viện.
- `AsyncLock` với key `'client'` — đồng bộ request, tránh chồng chéo file-based IPC.
- PCAP server tự động listen khi module được import.
- `api()` wrapper: nhận tên hàm + params, gọi `engine.runFunction()`, chuẩn hoá lỗi.
- `perfectCanvasRequest` trong params.options: set `requestTimeout = 0` (không timeout). Vì perfect canvas request có thể mất thời gian rất lâu.
- `cleanup()`: kill engine process + close PCAP server.
- Export `engine` instance để truy cập trực tiếp nếu cần custom flow.

## Thiết kế

### Kiến trúc

```
connector/index.ts
  ├── engine: RemoteEngine (singleton)
  ├── pcapServer.listen() (tự động)
  ├── api(name, params) → engine.runFunction() → error normalization
  └── cleanup() → engine.kill() + pcapServer.close()
```

### Luồng api()

```
api(name, params)
  │
  ├─ lock.acquire('client')
  │    ├─ Xác định requestTimeout:
  │    │    params.options.perfectCanvasRequest ? 0 : engine.requestTimeout
  │    │
  │    ├─ engine.runFunction(name, params, { requestTimeout })
  │    │
  │    ├─ Kiểm tra result.error
  │    │    ├─ contains 'key is missing' → throw MissingKeyError
  │    │    └─ other error → throw PluginError
  │    │
  │    └─ Trả về result.response ?? result
  │
  └─ release lock
```

Tại sao `result.response ?? result`: engine có thể trả về `{ response: ... }` hoặc trực tiếp dữ liệu. Cả hai đều hợp lệ.

Tham chiếu design doc: `docs/designs/api-connector.design.md`.

## API / Data flow

```ts
import { api, cleanup, engine } from '../../plugin/connector';

// Gọi setup
const result = await api('setup', {
  key: process.env.BABLOSOFT_KEY,
  fingerprint: { value: '...', options: {} },
  proxy: { value: 'http://...', options: { changeTimezone: true } },
});

// Với perfectCanvasRequest (không timeout)
const fpResult = await api('fetch', {
  options: { perfectCanvasRequest: true },
});

// Dùng engine trực tiếp (custom flow)
engine.setCwd('./custom/data');
engine.setArgs(['--custom-flag']);

// Cleanup
await cleanup();
```

### Các method engine có thể gọi qua api()

| Method | Mục đích |
|---|---|
| `setup` | Khởi tạo engine với fingerprint, proxy, profile |
| `fetch` | Lấy fingerprint từ service |
| `versions` | Lấy danh sách browser version |
| `get_bounds` | Lấy viewport bounds |
| `get_defaults` | Lấy cấu hình mặc định |

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/connector/index.ts` | API Connector — api(), cleanup(), engine export | 99 |
| `src/plugin/connector/engine.ts` | RemoteEngine — download, extract, IPC | 386 |
| `src/plugin/connector/pcapServer/index.ts` | PCAP TCP server — mock PCAP interface | 71 |

## Events

| Event | Handler | Output |
|---|---|---|
| `beforeDownload` | `engine.on('beforeDownload', ...)` | `console.log('Đang tải browser...')` |
| `beforeExtract` | `engine.on('beforeExtract', ...)` | `console.log('Đang cài đặt browser...')` |

## Environment variables

| Biến | Tác dụng |
|---|---|
| `FINGERPRINT_CWD` | Thư mục làm việc engine — truyền vào `RemoteEngine` constructor |
| `FINGERPRINT_TIMEOUT` | Timeout mặc định cho cả `engineTimeout` và `requestTimeout` |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `engine.runFunction` trả về `{ error: 'key is missing...' }` | Throw `MissingKeyError` — user cần set key |
| `engine.runFunction` trả về `{ error: '...' }` (lỗi khác) | Throw `PluginError` — lỗi engine chung |
| Engine chưa sẵn sàng | Engine tự throw bên trong (InvalidEngineError, EngineTimeoutError, RequestTimeoutError) |
| `api()` gọi đồng thời 2 lần | `async-lock` xếp hàng — lần 2 chờ lần 1 xong |

## Kiểm tra

- Happy path: `api('setup', { key, fingerprint })` → response thành công.
- Error: key missing → throw `MissingKeyError`.
- Error: engine timeout → throw `RequestTimeoutError`.
- Cleanup: `cleanup()` kill engine + close server, không throw.
- Lock: 2 `api()` gọi đồng thời chạy tuần tự.
