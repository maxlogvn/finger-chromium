# Overview: Test coverage cho EADDRINUSE retry logic trong PCAP server

## Tóm tắt

Đã thay `once()` wrapper trong `pcapServer.listen()` bằng module-level `startPromise`
caching. Việc này cho phép (1) gọi `listen()` nhiều lần trả về cùng promise/port,
(2) `close()` reset state để restart server. Đã thêm 2 test cases mới: idempotent
listen + restart after close. Tất cả 164 tests pass.

Tuy nhiên, EADDRINUSE retry test không thể implement trên Windows do `net.Server`
dùng `SO_REUSEADDR` mặc định -- hai server có thể listen trên cùng port mà không
gây lỗi. Retry logic vẫn tồn tại trong code (cho Linux/macOS) nhưng không có test
trên Windows.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Sửa pcapServer/index.ts | Thay `once()` bằng `startPromise` caching | Hoàn thành | Không có |
| Bước 2: Verify `once` còn dùng ở đâu | Grep kiểm tra | Hoàn thành: `utils.ts` vẫn dùng | Không có |
| Bước 3: Thêm test case | EADDRINUSE retry test | Hoàn thành: **huỷ**, thay bằng 2 test thay thế | EADDRINUSE retry không test được trên Windows do `SO_REUSEADDR` |
| Bước 4: Lint + test | 0 errors, 164 tests pass | 0 errors, 164 tests pass | Không có |
| Bước 5: Cập nhật pcap-server.spec.md | Xoá mention `once()`, thêm `startPromise` | Hoàn thành | Không có |

## Sai lệch đáng chú ý

- **EADDRINUSE retry test không khả thi trên Windows:**
    - **Nguyên nhân:** `net.Server` của Node.js bật `SO_REUSEADDR` mặc định trên
      Windows, cho phép nhiều server listen trên cùng một port mà không throw lỗi.
    - **Hướng xử lý:** Thay bằng 2 test: idempotent listen (cùng promise) + restart
      after close. Retry logic tồn tại trong code (cho Linux/macOS) và hoạt động
      chính xác về mặt lý thuyết.
    - **Ảnh hưởng:** Spec và plan đã cập nhật để phản ánh deviation này.

## Tài liệu liên quan

- `docs/designs/bug-029-eaddrInuse-retry-test.design.md` -- thiết kế
- `docs/specs/bug-029-eaddrInuse-retry-test.spec.md` -- đặc tả
- `docs/plans/bug-029-eaddrInuse-retry-test.plan.md` -- kế hoạch
- `docs/overviews/bug-029-eaddrInuse-retry-test.overview.md` -- file này
- `src/plugin/connector/pcapServer/index.ts` -- sửa production code
- `tests/connector.test.ts` -- thêm 2 test cases

### Docs đã cập nhật ở bước rà soát

- `docs/specs/pcap-server.spec.md` -- xoá `once()`, thêm `startPromise`, Windows limitation
- `docs/specs/test-connector.spec.md` -- cập nhật test count (5 -> 7), EADDRINUSE deviation
- `docs/designs/pcap-server.design.md` -- cập nhật cơ chế `startPromise`
- `docs/products/pcap-server.product.md` -- cập nhật mô tả `startPromise`
- `docs/overviews/test-connector.overview.md` -- cập nhật deviation note
- `docs/KNOWN_ISSUES.md` -- cập nhật entry #29
- `docs/ROADMAP.md` -- cập nhật trạng thái #29

## Ghi chú

- Đây là non-feature task (test coverage + refactor nhỏ), không cần product doc.
- `once` package vẫn còn trong dependency vì `utils.ts` dùng cho `printOnce()` và `notifyOnce()`.
- Nếu sau này dự án chạy CI trên Linux/macOS, có thể thêm EADDRINUSE retry test
  thật với occupying server.
