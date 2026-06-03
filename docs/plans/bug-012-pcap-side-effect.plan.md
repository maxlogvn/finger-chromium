# Plan: Bug #12 — PCAP server side effect ở module scope

## Các bước thực hiện

- [ ] Bước 1: Viết biến `initPromise` và hàm `ensureInit()` trong `connector/index.ts`
    - Làm gì: Thêm `let initPromise` (module-level) và `async function ensureInit()` — lazy init PCAP server.
    - File liên quan: `src/plugin/connector/index.ts`
    - Ghi chú: Dùng pattern check `if (!initPromise)` để đảm bảo chỉ chạy một lần.

- [ ] Bước 2: Xoá module-scope `pcapServer.listen()` cũ
    - Làm gì: Xoá đoạn `pcapServer.listen().then(...)` ở lines 63-66.
    - File liên quan: `src/plugin/connector/index.ts`
    - Phụ thuộc: Bước 1 hoàn thành.

- [ ] Bước 3: Thêm `await ensureInit()` vào đầu hàm `api()`
    - Làm gì: Gọi `await ensureInit()` trước `lock.acquire()` để đảm bảo PCAP server sẵn sàng.
    - File liên quan: `src/plugin/connector/index.ts`
    - Phụ thuộc: Bước 1-2 hoàn thành.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Kiểm tra thủ công:
- Import `connector` module (không gọi `api()`) — không có TCP server nào được mở.
- Gọi `api('ping', {})` — PCAP server phải start, engine phải nhận được args `--mock-pcap-port=...`.

## Ghi chú

- `pcapServer.listen()` đã dùng `once()` nên gọi nhiều lần vẫn an toàn — `ensureInit()` chỉ giúp `api()` await đúng lúc.
- `engine.setArgs()` sẽ ghi đè args mỗi lần gọi — vì `ensureInit()` chỉ chạy một lần nên chỉ set một lần, không ảnh hưởng.
