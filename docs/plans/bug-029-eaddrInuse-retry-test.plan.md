# Plan: Test coverage cho EADDRINUSE retry logic trong PCAP server

## Các bước thực hiện

- [ ] Bước 1: Sửa `pcapServer/index.ts` -- thay `once()` bằng `startPromise` caching
    - Làm gì: Bỏ `import once from 'once'`. Thêm module-level `startPromise`.
      `listen()` kiểm tra `startPromise`, nếu có thì return, nếu không thì tạo mới.
      `close()` reset `startPromise = undefined`.
    - File liên quan: `src/plugin/connector/pcapServer/index.ts`
    - Ghi chú: Giữ nguyên signature `listen(port?, host?)` và `close()`.
      Xoá `once` khỏi import.

- [ ] Bước 2: Xoá `once` khỏi source (nếu không còn dùng ở file nào khác)
    - Làm gì: Chạy grep kiểm tra `from 'once'` trong `src/` -- nếu `utils.ts` vẫn
      dùng `once` thì giữ nguyên.
    - File liên quan: (n/a -- chỉ verify)
    - Ghi chú: `utils.ts` dùng `once` cho `printOnce()` và `notifyOnce()` -- giữ lại.

- [-] Bước 3: Thêm test case thay thế cho EADDRINUSE retry (đã huỷ)
    - Ghi chú: EADDRINUSE retry test KHÔNG khả thi trên Windows do `net.Server`
      dùng `SO_REUSEADDR` mặc định -- listen trên port đã chiếm không throw
      EADDRINUSE. Thay bằng 2 test case:
    - Làm gì:
      1. Idempotent listen: gọi `pcapServer.listen()` nhiều lần -> cùng promise,
         cùng port reference.
      2. Restart after close: `close()` -> `listen()` -> server mới, idempotent
         sau restart.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 1 (production code thay đổi trước, test mới chạy được).

- [ ] Bước 4: Chạy lint + test verify
    - Làm gì: `npm run lint` và `npm test` -- đảm bảo 0 lỗi.
    - Ghi chú: Có thể cần `npm run build` nếu tsup kiểm tra, nhưng test chạy
      qua `tsx` loader nên không cần build.

- [ ] Bước 5: Cập nhật `docs/specs/pcap-server.spec.md`
    - Làm gì: Xoá mention `once()` trong Yêu cầu và Xử lý lỗi. Thay bằng
      `startPromise` caching. Cập nhật test count từ 5 lên 6.

## Kiểm tra

- `npm run lint` -- ESLint + Prettier pass
- `npm test` -- 164 tests pass (162 cũ + 2 mới: idempotent + restart)
- (Kiểm tra thủ công) Confirm `import once from 'once'` không còn trong pcapServer

## Ghi chú

- Thay đổi production code rất nhỏ (khoảng 5 dòng thêm, 2 dòng xoá).
- EADDRINUSE retry test không thể implement trên Windows do `net.Server` dùng
  `SO_REUSEADDR` mặc định (2 server có thể listen cùng port mà không lỗi).
- Retry logic tồn tại trong code (cho Linux/macOS) nhưng không test được trên
  môi trường Windows hiện tại.
- Thay thế bằng 2 test: idempotent listen + restart after close.
- `once` package vẫn còn trong dependency vì `utils.ts` dùng.
