# Plan: Bug #15 — PCAP server retry EADDRINUSE promise không resolve

## Các bước thực hiện

- [ ] Bước 1: Mở rộng Promise executor để nhận cả `reject`
    - File liên quan: `src/plugin/connector/pcapServer/index.ts:25`
    - Làm gì: Đổi `new Promise<number>((resolve) =>` thành `new Promise<number>((resolve, reject) =>`

- [ ] Bước 2: Sửa error handler — retry với callback, reject nếu không phải EADDRINUSE hoặc retry thất bại
    - File liên quan: `src/plugin/connector/pcapServer/index.ts:43-46`
    - Làm gì:
        - Biến listen callback thành function riêng `onListening` để dùng lại.
        - Trong error handler EADDRINUSE: gọi `svr.listen(port, host, onListening)` trong setTimeout.
        - Error không phải EADDRINUSE: gọi `reject(error)`.
        - Retry tối đa 1 lần — dùng flag `retried` để check.

- [ ] Bước 3: Kiểm tra
    - Làm gì: Chạy `npx tsc --noEmit`, `npm run lint`, `npm test`
    - Phụ thuộc: Bước 1-2 hoàn thành.

> Mỗi bước nên độc lập và có thể kiểm tra được sau khi hoàn thành.

## Kiểm tra

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`

## Ghi chú

- File test hiện tại (`quit-cleanup.test.ts`) chỉ test `close()` — không test `listen()`. Không cần thêm test vì bug #15 là logic bên trong `listen()` khó mock. Coverage sẽ được tăng trong task roadmap riêng.
- Biến `id` vẫn hoạt động bình thường — chỉ tăng trong data handler, không liên quan đến retry.
