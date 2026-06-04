# Overview: Đồng nhất style timer giữa các module

## Tóm tắt

Đã tạo `src/common/timer.ts` — centralized timer utility với `sleep()`, `withTimeout()`, `createTimer()` và `TimeoutError`. Chuyển toàn bộ 4 module (`config.ts`, `connector/engine.ts`, `connector/index.ts`, `connector/utils.ts`) sang dùng API mới, loại bỏ hoàn toàn việc import trực tiếp `timers/promises` và callback-style `setTimeout().unref()`.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Tạo `src/common/timer.ts` | Tạo file với `sleep()`, `withTimeout()`, `createTimer()`, `TimeoutError` | Đúng kế hoạch | Không có |
| Bước 2: Cập nhật `config.ts` | Xoá `import { setTimeout } from 'timers/promises'`, thay `await setTimeout(n)` bằng `await sleep(n)` | Đúng kế hoạch | Không có |
| Bước 3: Cập nhật `connector/engine.ts` | Thay 3 chỗ callback-style setTimeout bằng `createTimer()` | Đúng kế hoạch | Không có |
| Bước 4: Cập nhật `connector/index.ts` + `utils.ts` | Thay callback-style notify bằng `createTimer()` | Đúng kế hoạch | `utils.ts` — thay đổi kiểu trả về của `notify()` từ `ClearableTimer` sang `{ clear: () => void } \| undefined`. Phải wrap `console.log` trong arrow function để tránh lỗi type do overload resolution của `once()` package. |
| Bước 5: Kiểm tra | lint + typecheck + build + test pass | 164 tests pass, 3 pending (engine binary), 0 lỗi lint/typecheck/build | Không có |

## Sai lệch đáng chú ý

- **`once(console.log)` type issue:** Khi thay đổi `notify()` từ `setTimeout(printOnce, 20000, msg)` sang `timer.promise.then(() => printOnce(msg))`, TypeScript báo lỗi vì `once(console.log)` được infer là `() => void` (do overload matching). Đã fix bằng `once((msg: string) => console.log(msg))` để có type signature chính xác.

## Tài liệu liên quan

- `docs/designs/timer-management-uniform.design.md`
- `docs/specs/timer-management-uniform.spec.md`
- `docs/plans/timer-management-uniform.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #35 từ OPEN sang FIXED
- `src/common/timer.ts` — file mới
- `src/plugin/config.ts` — sửa import + call
- `src/plugin/connector/engine.ts` — sửa 3 chỗ setTimeout
- `src/plugin/connector/index.ts` — sửa notifyTimer handling
- `src/plugin/connector/utils.ts` — sửa notify() return type

## Ghi chú

- `createTimer()` dùng `setTimeout`/`clearTimeout` bên trong chứ không dùng `AbortSignal` — vì `AbortSignal` khiến promise reject khi abort, không phù hợp với use-case clearTimeout (promise không resolve/reject).
- `withTimeout()` không được dùng trong codebase hiện tại — giữ lại để dùng sau này khi cần race promise với timeout.
