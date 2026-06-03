# Overview: Cleaner race condition khi cleanup -- chờ engine process thoát hẳn (Bug fix #23)

## Tóm tắt

Đã fix race condition trong `FingerprintPlugin.cleanup()`: `RemoteEngine.kill()` là fire-and-forget, không đợi `FastExecuteScript.exe` thoát hẳn trước khi `cleaner.stop()` chạy. Chuyển `kill()`, `cleanup()` sang async, await process exit với timeout + SIGKILL fallback.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Chuyển `RemoteEngine.kill()` thành async | Thêm `KILL_TIMEOUT`, dùng `proc.once('exit')` + timeout + SIGKILL | Đã thêm `KILL_TIMEOUT = 5_000`, dùng `exitPromise` + `setTimeout` cho SIGKILL fallback | Không có |
| Bước 2: Chuyển `Connector.cleanup()` thành async | Đổi signature từ `void` sang `Promise<void>` | Đã đổi, await `this.#engine.kill()` | Không có |
| Bước 3: Cập nhật `FingerprintPlugin.cleanup()` | await `this.#connector.cleanup()` | Đã await | Không có |
| Bước 4: Kiểm tra | lint + typecheck + build + test | 0 lỗi lint, typecheck pass, build pass, 20/20 tests pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-023-cleanup-race-condition.design.md`
- `docs/specs/bug-023-cleanup-race-condition.spec.md`
- `docs/plans/bug-023-cleanup-race-condition.plan.md`
- `docs/overviews/bug-023-cleanup-race-condition.overview.md`

## Ghi chú

- `SIGKILL` trên Windows tương đương `taskkill /F` -- Node.js xử lý tự động.
- `KILL_TIMEOUT` mặc định 5000ms, export được để tuỳ chỉnh nếu cần.
