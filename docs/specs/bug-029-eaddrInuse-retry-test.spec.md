# Spec: Test coverage cho EADDRINUSE retry logic trong PCAP server

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).
> Đây là non-feature task (test coverage + refactor nhỏ), không cần product doc.

## Mô tả

PCAP server có cơ chế retry khi port bận (`EADDRINUSE`): error handler bắt `EADDRINUSE`,
set `retried = true`, chờ 1 giây, gọi `svr.listen()` lại. Tuy nhiên chưa có test nào
kiểm tra cơ chế này vì `listen()` bị bọc bởi `once()`.

Mục tiêu: thay `once()` bằng module-level `startPromise` caching để:
1. Giữ nguyên singleton behavior (gọi nhiều lần trả về cùng promise/port).
2. Cho phép `close()` reset state để restart server.
3. Viết test EADDRINUSE retry (phát hiện: không khả thi trên Windows do
   `net.Server` dùng `SO_REUSEADDR` mặc định -- thay bằng 2 test thay thế).

Tham chiếu design: `docs/designs/bug-029-eaddrInuse-retry-test.design.md`

## Yêu cầu

- **Production code:** Thay `once()` trên `listen()` bằng cơ chế `startPromise`.
  - `listen()` lần đầu: tạo `startPromise`, khởi động server.
  - `listen()` lần tiếp theo: trả về `startPromise` (same promise, same port).
  - `close()`: reset `startPromise = undefined`, đóng server.
- **Test:** Thêm 2 test cases trong `tests/connector.test.ts`:
  - Idempotent listen: gọi `listen()` nhiều lần -> cùng promise reference, cùng port.
  - Restart after close: `close()` -> `listen()` -> server mới, idempotent sau restart.
- **EADDRINUSE retry test:** Không khả thi trên Windows vì `net.Server` dùng
  `SO_REUSEADDR` mặc định, không thể kích hoạt EADDRINUSE qua normal means.
  Retry logic vẫn tồn tại trong code (cho Linux/macOS) nhưng không có test.
- **Không thay đổi behavior** của public API (`listen`, `close`).
- **Không thêm dependency mới.**

## Thiết kế

### Module-level state machine

```ts
// Thay:
export const listen = once((port, host) => { ... });

// Bằng:
let startPromise: Promise<number> | undefined;

export function listen(port = 0, host = '127.0.0.1'): Promise<number> {
  if (startPromise) return startPromise;

  let id = 0;
  let retried = false;

  startPromise = new Promise<number>((resolve, reject) => {
    const svr = net.createServer((socket) => {
      // ... giữ nguyên logic xử lý data ...
    });
    server = svr;

    const onListening = (): void => {
      const address = svr.address();
      if (address && typeof address === 'object') {
        resolve(address.port);
      }
      svr.unref();
    };

    svr.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && !retried) {
        retried = true;
        setTimeout(() => svr.listen(port, host, onListening), 1000).unref();
      } else {
        reject(error);
        startPromise = undefined; // cho phép thử lại lần sau
      }
    });

    svr.listen(port, host, onListening);
  });

  return startPromise;
}
```

### `close()` cập nhật

```ts
export const close = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        server = undefined;
        startPromise = undefined; // reset để cho phép restart
        resolve();
      });
    } else {
      resolve();
    }
  });
};
```

Tham chiếu design doc: `docs/designs/bug-029-eaddrInuse-retry-test.design.md`

## API / Data flow

### Production code change

```
before: listen() -> once() -> callback runs 1 time only
after:  listen() -> check startPromise
                     ├── exists -> return startPromise
                     └── null  -> create new Promise -> svr.listen()
                                  on error EADDRINUSE -> retry -> svr.listen() lại
                                  on other error -> reject + reset startPromise
```

### Test flow 1: Idempotent listen

```
1. promise1 = pcapServer.listen(0)
2. promise2 = pcapServer.listen(0)
3. promise1 === promise2 (cùng reference)
4. port1 = await promise1, port2 = await promise2
5. port1 === port2 (cùng port)
```

### Test flow 2: Restart after close

```
1. port1 = await pcapServer.listen(0)
2. await pcapServer.close() -> reset startPromise
3. port2 = await pcapServer.listen(0)
4. ok(port2 > 0)
5. promiseCheck = pcapServer.listen(0)
6. promiseCheck === pcapServer.listen(0) (idempotent sau restart)
7. await pcapServer.close()
```

### EADDRINUSE retry (không test được trên Windows)

```
Trên Windows: net.Server dùng SO_REUSEADDR, listen trên port đã chiếm
không throw EADDRINUSE -> retry logic không bao giờ được kích hoạt.

Trên Linux/macOS (không có SO_REUSEADDR mặc định):
1. occupyingSvr = net.createServer().listen(fixedPort)
2. pcapServer.listen(fixedPort) -> EADDRINUSE -> retry 1s
3. occupyingSvr.close() -> retry thành công
```

## Components

| File | Thay đổi |
|---|---|
| `src/plugin/connector/pcapServer/index.ts` | Sửa: thay `once()` bằng `startPromise` caching. Sửa `close()` reset `startPromise`. |
| `tests/connector.test.ts` | Thêm: 2 test cases (idempotent listen + restart after close) trong `describe('PCAP Server')`. |
| `docs/specs/pcap-server.spec.md` | Cập nhật: xoá mention `once()`, thêm `startPromise` caching. |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `listen()` gọi lần 2 khi server đang chạy | Trả về `startPromise` hiện tại (cùng port) |
| `listen()` gọi sau `close()` | Tạo server mới, port mới (nếu port=0) |
| `EADDRINUSE` ở lần retry thứ 2 (retried = true) | Reject error, reset `startPromise = undefined` |
| `close()` khi chưa có server | Resolve ngay, no-op |
| `listen()` với port=0 sau `close()` | Random port mới |

## Kiểm tra

### Test case: PCAP Server (7 tests, thêm 2 so với hiện tại)

| Case | Input | Expected |
|---|---|---|
| ...(5 tests cũ, giữ nguyên)... | | |
| Idempotent listen | Gọi `listen()` 2 lần | Cùng promise reference, cùng port |
| Restart after close | `close()` -> `listen()` lại | Server mới, port mới, idempotent sau restart |

### Test coverage

- Idempotent listen: gọi `listen()` nhiều lần -> cùng promise, cùng port.
- Restart: `close()` -> `listen()` -> server mới, hoạt động.
- EADDRINUSE retry: **không test được trên Windows** do `net.Server` dùng
  `SO_REUSEADDR` mặc định. Retry logic tồn tại trong code cho Linux/macOS.
