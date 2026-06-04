# Spec: PCAP Server

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

PCAP Server là một TCP server tối giản mô phỏng PCAP interface. Engine binary (`FastExecuteScript.exe`) cần server này để gửi và nhận ID request — đây là một phần của cơ chế đồng bộ giữa Node.js process và engine process.

Tên "PCAP" giữ từ code gốc của BAS (Browser Automation Studio). Nó không liên quan đến PCAP network capture thật.

Source: `src/plugin/connector/pcapServer/index.ts` (72 dòng).

## Yêu cầu

- `listen(port, host)` — khởi động TCP server, trả về port đang lắng nghe.
- `close()` — dừng server, giải phóng port. An toàn gọi nhiều lần.
- Chỉ hiểu 2 lệnh binary:
  - `0x01` (Request ID): engine yêu cầu ID mới — server phản hồi với ID dạng số.
  - `0x07` (Heartbeat): engine kiểm tra server còn sống — server phản hồi xác nhận.
- `startPromise` module-level caching: nếu `startPromise` đã tồn tại, trả về ngay (cùng promise, cùng port). `close()` reset `startPromise` để cho phép restart.
- Retry port khi `EADDRINUSE` (sau 1 giây). **Lưu ý Windows:** `net.Server` dùng `SO_REUSEADDR` mặc định nên EADDRINUSE không thể kích hoạt trên Windows qua normal means.
- Debug logging qua namespace `browser-with-fingerprints:connector:pcapServer`.

## Thiết kế

### Kiến trúc

```
net.createServer()
  │
  ├─ socket.on('data', buffer)
  │    ├─ byte === 0x01 → gửi response ID + id++
  │    └─ byte === 0x07 → gửi heartbeat response
  │
  ├─ socket.on('error') → debug log
  │
  └─ server.on('error', EADDRINUSE) → setTimeout retry
```

### Binary protocol

**Request ID (0x01):**
- Engine gửi: `[0x01]` (1 byte)
- Server phản hồi: `[0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id_LSB, id_byte1, id_byte2]` (9 bytes)
- Trong đó `id` là số 24-bit tăng dần.
- 6 byte đầu là fixed header: `0x01` (command), `0x04` (packet type), `0x00 0x00 0x00 0x0a` (payload length = 10 bytes).
- 3 byte cuối: `id & 0xff`, `(id >> 8) & 0xff`, `(id >> 16) & 0xff`.

**Heartbeat (0x07):**
- Engine gửi: `[0x07]` (1 byte)
- Server phản hồi: `[0x07, 0x00, 0x00, 0x00, 0x00]` (5 bytes) — xác nhận đơn giản.

Tham chiếu design doc: `docs/designs/pcap-server.design.md`.

## API / Data flow

```ts
import * as pcapServer from '../connector/pcapServer';

// Auto-start khi module connector/index.ts được import
// Nhưng có thể gọi thủ công:
const port = await pcapServer.listen(0, '127.0.0.1');
// port là random (do truyền 0)

// Port được dùng cho engine args
engine.setArgs([`--mock-pcap-port=${port}`]);

// Dừng server
await pcapServer.close();
```

### Input

- `listen(port = 0, host = '127.0.0.1')` → `Promise<number>`.

### Output

- Port number đang lắng nghe.

### Luồng

```
Lần gọi api() đầu tiên
  │
  └─ ensureInit() → pcapServer.listen(0, '127.0.0.1')
       │
       ├─ [EADDRINUSE] setTimeout 1s → retry (resolve promise gốc khi thành công)
       │
       └─ [OK] Resolve port → set engine args --mock-pcap-port=<port>
            │
            └─ Engine kết nối → gửi 0x01 / 0x07 → server phản hồi
```

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/connector/pcapServer/index.ts` | TCP server (lazy init) | 72 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Port đã dùng (EADDRINUSE) | Retry sau 1 giây — gọi `server.listen()` lại, không throw. **Không test được trên Windows** do `SO_REUSEADDR`. |
| Socket error | `debug` log — server vẫn chạy, không crash |
| `listen()` gọi lần thứ hai (server đang chạy) | Trả về `startPromise` hiện tại (cùng promise, cùng port) |
| `listen()` gọi sau `close()` | Tạo server mới, port mới (reset `startPromise = undefined` trong `close()`) |
| `close()` khi chưa có server | Resolve ngay — không throw |

## Kiểm tra

- Happy path: listen thành công, engine kết nối, gửi 0x01/0x07, nhận response.
- Edge case: port đã dùng (EADDRINUSE) → tự động retry, cuối cùng listen thành công. **Không test được trên Windows** do `SO_REUSEADDR`.
- Edge case: `listen()` gọi 2 lần → trả về `startPromise` hiện tại (idempotent, cùng port).
- Restart: `close()` → `listen()` lại → server mới, port mới (nếu port=0).
- Close: `close()` → server dừng, port giải phóng.
- Close khi chưa listen: resolve ngay, không lỗi.
