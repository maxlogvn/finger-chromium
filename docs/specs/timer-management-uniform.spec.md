# Spec: Đồng nhất style timer giữa các module

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md). Tham chiếu design: [timer-management-uniform.design.md](../designs/timer-management-uniform.design.md)

## Mô tả

Tạo centralized timer utility tại `src/common/timer.ts` để thay thế cả 2 style timer hiện tại (`timers/promises` và callback-style `setTimeout().unref()`), đảm bảo toàn bộ codebase dùng chung một API timer duy nhất.

## Yêu cầu

- `sleep(ms)` — delay Promise-based, tự động `.unref()`, không giữ event loop
- `withTimeout<T>(promise, ms, msg?)` — race promise với timeout, throw `TimeoutError`
- `createTimer(ms)` — thay thế callback `setTimeout` + `clearTimeout`, trả về `{ promise, clear }`, tự động `.unref()`
- Các module hiện tại phải được chuyển sang dùng API mới, không còn import `timers/promises` hay global `setTimeout` trực tiếp
- `TimeoutError` export được để consumer có thể `instanceof` check

## Thiết kế

Một file duy nhất `src/common/timer.ts` chứa tất cả timer utility. Dùng `timers/promises` làm nền tảng (vì đã là Promise-style), thêm `createTimer()` cho use-case cần clearTimeout.

## API / Data flow

```
sleep(1000)        → Promise<void>          — chờ 1s, tự động unref
withTimeout(fetch(...), 5000, 'timeout') → Promise<T> — race, throw nếu quá 5s
createTimer(3000)  → { promise, clear }     — tạo timer 3s, clear() để hủy
```

## Components

### File mới

| File | Nội dung |
|---|---|
| `src/common/timer.ts` | `sleep()`, `withTimeout()`, `createTimer()`, `TimeoutError` |

### File sửa

| File | Thay đổi |
|---|---|
| `src/plugin/config.ts:12` | Xoá `import { setTimeout } from 'timers/promises'` → import `sleep` từ `../../common/timer` |
| `src/plugin/config.ts:109` | `await setTimeout(n)` → `await sleep(n)` |
| `src/plugin/connector/engine.ts:285-288` | `setTimeout(() => reject(...), t).unref()` + `clearTimeout` → `createTimer(t)` |
| `src/plugin/connector/engine.ts:291-294` | `closeTimer = setTimeout(...)` + `clearTimeout` → `createTimer(this.#closeTimeout)` |
| `src/plugin/connector/engine.ts:421-423` | `setTimeout(() => proc.kill('SIGKILL'), t).unref()` + `clearTimeout` → `createTimer(timeout)` |
| `src/plugin/connector/engine.ts:282` | Xoá khai báo `closeTimer`, `requestTimer` kiểu `NodeJS.Timeout` |
| `src/plugin/connector/index.ts:118,126,133` | Callback-style `notifyTimer` → dùng `createTimer()` |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `withTimeout()` trigger timeout | throw `TimeoutError` |
| `createTimer().clear()` gọi trước khi timer fire | timer bị hủy, `promise` không bao giờ resolve |
| `sleep(0)` hoặc `sleep(-1)` | `timers/promises` setImmediate behavior — giữ nguyên |
| `createTimer(0)` | fire ngay lập tức (setTimeout(fn, 0)) |

## Kiểm tra

Test tập trung vào `src/common/timer.ts` và integration test cho các file đã chuyển đổi.

- `sleep(n)` resolves sau ~n ms
- `withTimeout()` trả về kết quả nếu promise hoàn thành trước timeout
- `withTimeout()` throw `TimeoutError` nếu promise chậm hơn timeout
- `createTimer().clear()` hủy timer thành công, promise không resolve
- `createTimer().promise` resolve sau n ms nếu không bị clear
- `config.ts` vẫn hoạt động đúng sau khi chuyển sang `sleep()`
- `engine.ts` request timeout và close timeout vẫn hoạt động sau khi chuyển sang `createTimer()`
- `engine.ts` kill timeout (SIGKILL fallback) vẫn hoạt động
