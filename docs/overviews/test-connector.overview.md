# Overview: Test Connector (RemoteEngine + Connector + PCAP)

## Tóm tắt

Đã viết unit test cho ba module trong `src/plugin/connector/`: `engine.ts` (RemoteEngine), `index.ts` (Connector), và `pcapServer/index.ts` (PCAP server). Tổng cộng 27 test cases mới, tất cả pass cùng với 58 test cũ (85/85 pass). Phương pháp hybrid: PCAP server test với TCP thật, RemoteEngine helpers test với file thật + HTTP server local, Connector test với mock RemoteEngine.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Tạo file test | Tạo `tests/connector.test.ts` với 3 describe blocks | Hoàn thành | Không có |
| Bước 2: PCAP Server tests | 5 test cases (listen, request ID, heartbeat, data rỗng, close) | Hoàn thành | Không có |
| Bước 3: RemoteEngine constructor + setters | 7 test cases | Hoàn thành | Giá trị default requestTimeout là 0, không phải DEFAULT_TIMEOUT — đã fix assertion |
| Bước 4: RemoteEngine helpers | 5 test cases (exists, checksum, download) | Hoàn thành | Cần export 4 helper functions từ engine.ts để test được |
| Bước 5: RemoteEngine kill() | 3 test cases | Hoàn thành | Không thể test kill process thật vì `#process` là JS private field — test no-op path |
| Bước 6: Connector tests | 7 test cases (constructor, api, cleanup) | Hoàn thành | Bỏ `require.cache` vì không dùng được trong ESM — import trực tiếp |
| Bước 7: Lint + typecheck + test | Pass tất cả | 0 errors, 15 warnings (có sẵn), typecheck pass, 85/85 tests pass | Không có |

## Sai lệch đáng chú ý

- **Export helper functions:** Để test `exists()`, `checksum()`, `download()`, `fetchWithFallback()`, cần thêm `export` vào 4 function trong `engine.ts`. Đây là thay đổi nhỏ, không ảnh hưởng behavior.
- **ESM module cache:** Ban đầu định dùng `require.cache` để reset `initPromise` trong Connector, nhưng ESM không hỗ trợ `require.cache`. Giải pháp: import Connector trực tiếp, PCAP server dùng `once()` nên chỉ init một lần trong cả test suite — không ảnh hưởng test.
- **JS private fields (`#process`, `#meta`):** Không thể mock hoặc inject giá trị vào private fields từ bên ngoài. Hạn chế khả năng test `runFunction()` và `kill()` với process thật. Các test hiện tại chỉ test hành vi no-op và indirect qua Connector.
- **Bỏ EADDRINUSE retry test:** Không test được vì `listen()` dùng `once()` — chỉ chạy một lần, không thể test retry logic.

## Tài liệu liên quan

- `docs/designs/test-connector.design.md` — thiết kế
- `docs/specs/test-connector.spec.md` — đặc tả
- `docs/plans/test-connector.plan.md` — kế hoạch
- `docs/overviews/test-connector.overview.md` — file này
- `tests/connector.test.ts` — file test mới
- `src/plugin/connector/engine.ts` — export thêm 4 helper functions cho testability

## Ghi chú

- Task này là non-feature task (chỉ viết test), không cần product doc.
- Integration test với engine thật đã được triển khai tại `tests/integration-connector.test.ts` (xem [overview](overviews/test-integration-engine-binary.overview.md)).
- `runFunction()` vẫn chưa được test trực tiếp — chỉ test qua Connector mock. Integration test sẽ fill gap này.
