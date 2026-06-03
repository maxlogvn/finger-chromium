# Overview: Test coverage cho `runFunction()` IPC core (Issue #28)

## Tóm tắt

Đã thêm 6 test cases cho `RemoteEngine.runFunction()` trong `tests/connector.test.ts`, dùng cơ chế `RemoteEngine._execFile` mock + temp directory để bypass engine binary thật. Tổng số 162 tests đều pass. Hai sai lệch chính so với plan: override cơ chế `child_process.execFile` thay vì `child_process.execFile` do ESM live binding immutable, và thêm `_closeTimeout` để test process đóng nhanh.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm import child_process namespace | Import `child_process` từ `node:child_process` | Import `RemoteEngine` + sử dụng `RemoteEngine._execFile` | Plan dùng `child_process.execFile = mock`, thực tế dùng `RemoteEngine._execFile = mock` vì ESM live binding immutable |
| Bước 2: Thêm `runFunction()` describe + helper | `simulateResponse` helper + beforeEach/afterEach | Giống kế hoạch, thêm `origCloseTimeout` | Không có |
| Bước 3: Test case "thành công" | parse JSON response | Pass | Không có |
| Bước 4: Test case "timeout" | RequestTimeoutError | Pass | Không có |
| Bước 5: Test case "requestTimeout=0" | không set timeout | Pass | Không có |
| Bước 6: Test case "invalid JSON" | `simulateResponse('not-json-content')` | Thêm `raw = true` flag trong `simulateResponse` | `JSON.stringify('not-json-content')` tạo JSON hợp lệ `'"not-json-content"'` — phải dùng raw write |
| Bước 7: Test case "process đóng" | Race giữa close handler 60s và requestTimeout | Dùng `RemoteEngine._closeTimeout = 100`, `requestTimeout = 0` | Plan chấp nhận race condition; thực tế thêm `_closeTimeout` để deterministic |
| Bước 8: Test case "dọn file rác" | Xoá file request cũ | Pass | Không có |
| Bước 9: Lint + typecheck + full test | 122 tests pass | 162 tests pass | 40 test cases có sẵn từ các task trước |
| Bước 10: Cập nhật docs | spec + overview | Đang thực hiện | |

## Sai lệch đáng chú ý

### 1. `child_process.execFile` override không hoạt động với ESM built-in

- **Nguyên nhân:** Node.js built-in module live binding là immutable qua ESM namespace import. `import { execFile } from 'node:child_process'` không thể bị override từ ngoài.
- **Hướng xử lý đã áp dụng:** Thêm `static _execFile = nodeExecFile` trong `RemoteEngine`, `#startProcessInternal()` gọi `RemoteEngine._execFile(...)`. Test override `RemoteEngine._execFile = mock`.
- **Ảnh hưởng đến plan/spec:** Cần cập nhật spec (đã cập nhật) và plan.

### 2. `CLOSE_TIMEOUT = 60_000` không thể override từ test

- **Nguyên nhân:** `CLOSE_TIMEOUT` là module-level `const`, không thể sửa từ ngoài.
- **Hướng xử lý:** Thêm `static _closeTimeout = CLOSE_TIMEOUT` trong `RemoteEngine`, `runFunction()` dùng `RemoteEngine._closeTimeout`. Test đặt `RemoteEngine._closeTimeout = 100`.
- **Ảnh hưởng đến plan/spec:** Cần cập nhật spec (đã cập nhật) và plan.

### 3. `simulateResponse` dùng `JSON.stringify` — invalid JSON test không hoạt động

- **Nguyên nhân:** `JSON.stringify('not-json-content')` tạo `'"not-json-content"'` — valid JSON string literal.
- **Hướng xử lý:** Thêm `raw` flag vào `simulateResponse`: `raw = true` → ghi raw string thay vì `JSON.stringify`.
- **Ảnh hưởng đến plan/spec:** Cần cập nhật spec (đã cập nhật).

### 4. Test count thay đổi

- **Nguyên nhân:** Các task test trước đó đã thêm 40 test cases vào tổng số.
- **Hướng xử lý:** Cập nhật expected count trong spec từ 122 lên 162.
- **Ảnh hưởng đến plan/spec:** Cần cập nhật spec (đã cập nhật).

## Tài liệu liên quan

- `docs/designs/test-runfunction-ipc-core.design.md`
- `docs/specs/test-runfunction-ipc-core.spec.md`
- `docs/plans/test-runfunction-ipc-core.plan.md`
- `src/plugin/connector/engine.ts` — thêm `_execFile` và `_closeTimeout` static fields
- `tests/connector.test.ts` — thêm 6 test cases
- `docs/KNOWN_ISSUES.md` — Issue #28: OPEN → FIXED
- `docs/ROADMAP.md` — Đánh dấu "Hoàn thành"

## Ghi chú

- **ESM lưu ý:** Không thể override built-in module functions qua namespace import. Pattern `static _xxx = realFn` trong class là cách an toàn để inject test doubles.
- **Test speed:** Test "process đóng" giảm từ 60s xuống ~300ms nhờ `_closeTimeout = 100`.
- **Raw write:** Helper `simulateResponse` cần flag `raw` khi muốn ghi dữ liệu không phải JSON.
- **Spec cập nhật:** Các thay đổi về mechanism (`_execFile`, `_closeTimeout`, `raw` flag) cần được phản ánh trong spec doc (đã cập nhật).
