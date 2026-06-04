# Design: Test coverage cho EADDRINUSE retry logic trong PCAP server

## Bối cảnh

PCAP server (`src/plugin/connector/pcapServer/index.ts`) có cơ chế retry khi port bận
(`EADDRINUSE`): nếu lần listen đầu thất bại, chờ 1 giây rồi retry.

Hiện tại không có test nào kiểm tra cơ chế này. Nguyên nhân gốc: `listen()` được bọc bởi
`once()` từ package `once` -- chỉ chạy callback một lần. Điều này khiến không thể gọi
`listen()` lần thứ hai để tạo kịch bản EADDRINUSE.

Hậu quả nếu retry hỏng: `pcapServer.listen()` treo promise vĩnh viễn, toàn bộ Connector
ngừng hoạt động.

## Câu hỏi làm rõ

- `once()` có cần thiết không? -> Connector đã có `initPromise` module-level guard.
  `once()` trên `listen()` là dư thừa và gây khó test.
- Sau khi `close()`, có cần gọi `listen()` lại được không? -> Có, nếu không thì process
  không thể restart server. `once()` ngăn cản điều này.
- Có thể test EADDRINUSE mà không sửa production code không? -> Không, vì `once()` chặn
  mọi lần gọi `listen()` sau lần đầu.

## Các phương án

### Phương án 1: Thay `once()` bằng `startPromise` caching (khuyên dùng)

Bỏ `import once`, thêm module-level `let startPromise: Promise<number> | undefined`.

```ts
let startPromise: Promise<number> | undefined;

export function listen(port = 0, host = '127.0.0.1'): Promise<number> {
  if (startPromise) return startPromise;

  let id = 0;
  let retried = false;

  startPromise = new Promise<number>((resolve, reject) => {
    // ... giữ nguyên logic hiện tại ...
  });

  return startPromise;
}
```

Trong `close()`: thêm `startPromise = undefined` để cho phép restart.

- **Ưu điểm:**
  - Giữ nguyên singleton behavior (gọi nhiều lần trả về cùng promise/port)
  - Cho phép restart sau `close()` -- đúng behavior kỳ vọng
  - Test được EADDRINUSE: gọi `close()` để reset, tạo server chiếm port, gọi `listen()`
  - Bỏ được dependency `once` trong pcap server (vẫn còn trong `utils.ts`)
  - Thay đổi nhỏ, dễ review
- **Nhược điểm:**
  - Thay đổi production code (dù minimal)

### Phương án 2: Export `listenRaw()` không `once` cho testing

Giữ nguyên `listen()` với `once()`. Thêm `export function listenRaw()` không có `once`
và đánh dấu `@internal`.

- **Ưu điểm:** Không thay đổi public API behavior.
- **Nhược điểm:**
  - Export internal function chỉ để test -- tương tự Issue #34 (static property cho test)
  - Hai function làm gần như cùng một việc, gây nhầm lẫn
  - `once()` vẫn ngăn restart sau `close()` trong production

### Phương án 3: Reset `once` state qua property

Khai thác implementation detail của `once` package: set `pcapServer.listen.called = false`
trong test.

- **Ưu điểm:** Không sửa production code.
- **Nhược điểm:**
  - Dựa vào internal của package `once` (fragile)
  - Cần biết chính xác implementation của `once` 1.4.0
  - Không solve được vấn đề restart sau `close()` trong production
  - Code smell rõ rệt

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (thay `once()` bằng `startPromise` caching).
- **Phương án được chọn:** Phương án 1.
- **Lý do:** Giải quyết triệt để vấn đề: vừa test được EADDRINUSE (trên Linux/macOS),
  vừa cho phép restart server. Thay đổi production code rất nhỏ.
- **Ràng buộc:** Module-level `startPromise` phải được reset trong `close()` để tránh
  memory leak và cho phép restart.
- **Windows limitation:** `net.Server` dùng `SO_REUSEADDR` mặc định trên Windows,
  nên không thể trigger EADDRINUSE qua normal means. Do đó 2 test thay thế đã thêm:
  idempotent listen + restart after close.
