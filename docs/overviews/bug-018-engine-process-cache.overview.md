# Overview: Bug #18 — Cache engine process giữa các API calls

## Tóm tắt

Đã fix `#startProcess()` trong `RemoteEngine` để cache process engine giữa các API calls. Trước đây mỗi lần gọi `runFunction()` đều spawn `FastExecuteScript.exe` mới; giờ đây process cũ được tái sử dụng nếu còn sống, chỉ spawn lại khi process đã chết hoặc bị `kill()`.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm `#isProcessAlive()` helper | Thêm private method kiểm tra process còn sống | Đã thêm sau `#startProcessInternal()`, dùng `proc.killed` + `process.kill(pid, 0)` | Không có |
| Bước 2: Sửa `#startProcess()` cache | Nếu process alive, return luôn; chỉ spawn khi cache miss | Đã sửa — thêm check đầu method, debug log khi tái sử dụng | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-018-engine-process-cache.design.md`
- `docs/specs/bug-018-engine-process-cache.spec.md`
- `docs/plans/bug-018-engine-process-cache.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #18 từ OPEN sang FIXED
- `docs/ROADMAP.md` — thêm ghi chú bug fix trong mục RemoteEngine
- `src/plugin/connector/engine.ts` — sửa code

## Ghi chú

- Issue #14 (RemoteEngine singleton) có liên quan — sau khi tách `RemoteEngine` khỏi singleton, cần kiểm tra logic cache process vẫn hoạt động đúng.
