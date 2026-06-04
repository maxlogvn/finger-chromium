# Design: Đồng nhất style timer giữa các module

## Bối cảnh

Hiện tại codebase dùng 2 style timer khác nhau giữa các module:
- `config.ts` dùng `import { setTimeout } from 'timers/promises'` (Promise-style)
- `connector/engine.ts` dùng `setTimeout(() => {}, n).unref()` callback-style với `clearTimeout`
- `connector/index.ts` dùng callback-style qua hàm `notify()`

Điều này gây khó maintain, khó test, và dễ quên `.unref()` dẫn đến process không thoát (đã từng có P0 bug #21).

## Câu hỏi làm rõ

- Nên đặt centralized timer utility ở đâu? → `src/common/timer.ts` (phù hợp với nhóm `common/`)
- Scope có cần xử lý timeout với error class riêng không? → Cần, vì connector dùng `RequestTimeoutError`

## Các phương án

### Phương án A: Minimal — chỉ `sleep(ms)`

Export một hàm `sleep(ms)` dùng `timers/promises`. Các module callback-style tự xử lý riêng.

- Ưu điểm: Rất đơn giản, ít code.
- Nhược điểm: Connector/engine.ts vẫn phải dùng callback-style `setTimeout` — không giải quyết triệt để vấn đề đồng nhất.

### Phương án B: Trung dung — `sleep()` + `withTimeout()`

Thêm hàm `withTimeout<T>(promise, ms, errorMsg)` để race promise với timeout dùng `AbortSignal`.

- Ưu điểm: Giải quyết use-case timeout race. Dùng `AbortSignal` để clear timer tự động.
- Nhược điểm: Không hỗ trợ use-case cần clear timer thủ công (connector engine đang cần).

### Phương án C: Đầy đủ — `sleep()`, `withTimeout()`, `createTimer()`

Thêm `createTimer(ms)` trả về `{ promise: Promise<void>, clear: () => void }` — thay thế trực tiếp cho callback-style `setTimeout` + `clearTimeout` + `.unref()`.

- Ưu điểm: Bao phủ mọi use-case hiện tại. Đồng nhất 100% style timer trong toàn bộ codebase. Dễ test (mock promise thay vì fake timer). Tự động `.unref()`.
- Nhược điểm: Nhiều code hơn 2 phương án kia, nhưng vẫn rất nhỏ (~30 dòng).

## Giải pháp được chọn

- Phương án AI đề xuất: **Phương án C** — vì giải quyết triệt để vấn đề, bao phủ mọi use-case, dễ test.
- Phương án được chọn: Phương án C (đã thống nhất với người duyệt)
- Lý do: Tạo một centralized API duy nhất cho mọi nhu cầu timer, loại bỏ hoàn toàn callback-style `setTimeout` khỏi codebase.
- Ràng buộc: `createTimer()` phải tự động `.unref()` để không giữ event loop.
