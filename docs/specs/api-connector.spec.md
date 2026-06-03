# Spec: API Connector

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

API Connector (class `Connector`) là lớp trung gian giữa `FingerprintPlugin` (gọi lệnh) và `RemoteEngine` (thực thi). Mỗi `FingerprintPlugin` instance sở hữu `Connector` riêng với `RemoteEngine` riêng và `AsyncLock` riêng. Nó dùng `async-lock` để đồng bộ — chỉ một request được xử lý tại một thời điểm — và tự động chuẩn hoá lỗi từ engine thành `MissingKeyError` hoặc `PluginError`.

PCAP server là singleton dùng chung cho cả process, lazy init ở lần gọi API đầu tiên.

Source: `src/plugin/connector/index.ts` (khoảng 130 dòng).

## Yêu cầu

- Class `Connector` — mỗi `FingerprintPlugin` instance sở hữu Connector riêng (không còn singleton).
- `AsyncLock` với key `'client'` — đồng bộ request, tránh chồng chéo file-based IPC.
- PCAP server lazy init — chỉ listen ở lần gọi API đầu tiên.
- `api()` wrapper: nhận tên hàm + params, gọi `engine.runFunction()`, chuẩn hoá lỗi.
- `perfectCanvasRequest` trong params.options: set `requestTimeout = 0` (không timeout). Vì perfect canvas request có thể mất thời gian rất lâu.
- `cleanup()`: kill engine process + close PCAP server (nếu đã init).

## Thiết kế

### Kiến trúc

```
connector/index.ts
  ├── class Connector (mỗi instance sở hữu RemoteEngine riêng)
  ├── pcapServer.listen() (lazy init)
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
import { Connector } from '../../plugin/connector';

const connector = new Connector();

// Gọi setup
const result = await connector.api('setup', {
  key: process.env.BABLOSOFT_KEY,
  fingerprint: { value: '...', options: {} },
  proxy: { value: 'http://...', options: { changeTimezone: true } },
});

// Với perfectCanvasRequest (không timeout)
const fpResult = await connector.api('fetch', {
  options: { perfectCanvasRequest: true },
});

// Cleanup
await connector.cleanup();
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
| `src/plugin/connector/index.ts` | API Connector — class Connector với api(), cleanup() | ~130 |
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
