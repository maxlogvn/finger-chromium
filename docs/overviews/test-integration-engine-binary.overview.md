# Overview: Integration test với engine binary thật FastExecuteScript.exe

## Tóm tắt

Đã viết integration test cho RemoteEngine với engine binary thật (FastExecuteScript.exe) để verify pipeline download -> extract -> spawn -> IPC call `runFunction('ping', {key})` hoạt động end-to-end. Trước đây 100% test là unit/hybrid -- pipeline này chưa từng được test với engine thật.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Tạo file test | Tạo `tests/integration-connector.test.ts` với boilerplate imports | Hoàn thành | Không có |
| Bước 2: before() + after() hooks | before(): PCAP start + temp dir + timeout 120s. after(): cleanup temp dir | Hoàn thành | PCAP server tự tạo (không dùng pcapServer module) để tránh `once()` issue |
| Bước 3: describe.skip thiếu BABLOSOFT_KEY | Dùng ternary: `process.env.BABLOSOFT_KEY ? describe : describe.skip` | Hoàn thành | Không có |
| Bước 4: Test case 1 -- ping với key hợp lệ | RemoteEngine.runFunction('ping', {key}) -> result không error, response tồn tại | Hoàn thành | Không có |
| Bước 5: Test case 2 -- ping không key | RemoteEngine.runFunction('ping', {}) -> result.error === 'key is missing' | Hoàn thành | Không có |
| Bước 6: Test case 3 -- nhiều IPC call | 3 lần runFunction liên tiếp, mỗi lần đều thành công, process được reuse | Hoàn thành | Không có |
| Bước 7: Kiểm tra | lint + typecheck + test pass | 0 error lint, typecheck pass, 162 tests pass + 3 pending (skip) | Không có |

## Sai lệch đáng chú ý

- **PCAP server riêng:** Ban đầu định dùng `pcapServer.listen()` từ module có sẵn, nhưng pcapServer dùng `once()` wrapper -- chỉ cho phép listen một lần trong toàn bộ process. File test khác (`connector.test.ts`) đã gọi `listen()` và `close()` trong lifecycle của nó, nên integration test không thể reuse. Giải pháp: tạo TCP server riêng trong file test bằng `net.createServer()`.
- **Test descriptions không dấu:** Test descriptions bị lỗi encoding khi gửi qua tool chain. Chuyển sang tiếng Anh cho test names để tránh lỗi, giữ tiếng Việt trong header comment.
- **Không refactor RemoteEngine:** Spec cũ (test-connector.spec.md) nói rằng cần refactor RemoteEngine để hỗ trợ DI. Thực tế integration test có thể dùng RemoteEngine trực tiếp mà không cần refactor -- private fields (`#meta`, `#process`, `#cwd`) không phải vấn đề vì test tạo engine instance riêng với temp directory riêng.

## Tài liệu liên quan

- `docs/designs/test-integration-engine-binary.design.md` -- thiết kế
- `docs/specs/test-integration-engine-binary.spec.md` -- đặc tả
- `docs/plans/test-integration-engine-binary.plan.md` -- kế hoạch
- `docs/overviews/test-integration-engine-binary.overview.md` -- file này
- `tests/integration-connector.test.ts` -- file test mới
- `docs/KNOWN_ISSUES.md` -- Issue #33 đã chuyển sang FIXED

## Ghi chú

- Task này là non-feature task (chỉ viết test), không cần product doc.
- Integration test chỉ chạy khi `BABLOSOFT_KEY` được set trong environment.
- 3 test cases pending (skip) khi không có key -- không ảnh hưởng đến 162 unit tests.
- Khi có key, test 1 sẽ download engine ~20-50MB, có thể mất 30-120 giây.
