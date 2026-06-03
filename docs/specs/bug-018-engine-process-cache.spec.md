# Spec: Bug #18 — Cache engine process giữa các API calls

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Hiện tại mỗi lần gọi `runFunction()` trong `RemoteEngine` đều spawn mới `FastExecuteScript.exe` — dù process cũ vẫn chạy nền và sẵn sàng xử lý request tiếp theo. Fix này cache process engine, chỉ spawn lại khi process đã chết, giúp tiết kiệm tài nguyên và tăng tốc các API call sau lần đầu.

Tham chiếu design: `docs/designs/bug-018-engine-process-cache.design.md`

## Yêu cầu

Functional:
- Khi `#startProcess()` được gọi và process hiện tại còn sống, trả về process cũ, không spawn mới.
- Khi process hiện tại đã chết (killed, crash, hoặc exit), spawn mới tự động.
- Sau khi `kill()` được gọi, lần `#startProcess()` tiếp theo phải spawn mới.
- Chỉ áp dụng timeout khi thực sự spawn process mới — lần cache không cần timeout.

Non-functional:
- Không thay đổi API public — caller không biết có cache.
- Thay đổi tối thiểu, tập trung trong 1 method.
- Zero impact lên `connector/index.ts` và các module khác.

## Thiết kế

Thêm private method `#isProcessAlive()` kiểm tra trạng thái process. Sửa `#startProcess()`: kiểm tra cache đầu method, nếu còn sống thì return ngay.

Luồng mới:
1. `runFunction()` gọi `#startProcess(timeout)`.
2. `#startProcess()` kiểm tra `this.#isProcessAlive(this.#process)`:
   - `true` → debug log + return `this.#process`.
   - `false` → spawn mới (logic cũ) với timeout nếu có.
3. `runFunction()` dùng process trả về để tạo request/watch response (giống hệt cũ).

## API / Data flow

Không có thay đổi API. Luồng data giữ nguyên — chỉ thay đổi implementation detail ở tầng process management.

```
Before: runFunction() → #startProcess() → #startProcessInternal() → spawn (always)
After:  runFunction() → #startProcess() → [cache hit? → return existing | cache miss → spawn]
```

## Components

- `src/plugin/connector/engine.ts` (sửa):
  - Thêm private method `#isProcessAlive(proc?: ChildProcess): boolean`.
  - Sửa `#startProcess()` — nếu process alive, return `this.#process!`; chỉ spawn khi cần.
- Các file khác không cần sửa.

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Process crash giữa các API call | `#isProcessAlive()` → false → spawn mới |
| `kill()` được gọi | Set `this.#process = undefined` → lần sau spawn mới |
| PID đã được OS tái sử dụng | `process.kill(pid, 0)` vẫn trả về thành công → process cũ coi như alive. Rủi ro rất thấp vì PID reuse thường xảy ra sau nhiều phút; nếu có, engine sẽ gặp lỗi IPC và lần gọi API sau sẽ fail/respawn. |
| Timeout vẫn áp dụng cho lần spawn thực tế | Không thay đổi logic timeout hiện tại. |

## Kiểm tra

- **Happy path:** Gọi `runFunction()` 2 lần liên tiếp — lần 2 không spawn process mới.
- **Edge case:** Gọi `kill()` giữa 2 lần `runFunction()` — lần sau spawn mới.
- **Edge case:** Process crash bên ngoài — lần gọi API sau spawn lại.
- **Integration test:** Test với browser thật — fetch fingerprint (lần 1 spawn) → configure (lần 2 reuse) → launch (lần 3 reuse).
