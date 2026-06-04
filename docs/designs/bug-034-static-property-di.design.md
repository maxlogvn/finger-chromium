# Design: Refactor static property `_execFile` và `_closeTimeout` sang DI

## Bối cảnh

`RemoteEngine._execFile` và `RemoteEngine._closeTimeout` là hai static public property
trong `src/plugin/connector/engine.ts:194,197` được expose ra `public` chỉ để
phục vụ test (Issue #28 -- test-runfunction-ipc-core).

```ts
export default class RemoteEngine extends EventEmitter {
  /** @internal For testing — override để mock child_process.execFile. */
  static _execFile = nodeExecFile;

  /** @internal For testing — override để rút ngắn CLOSE_TIMEOUT. */
  static _closeTimeout = CLOSE_TIMEOUT;
}
```

- `_execFile` được dùng ở `#startProcessInternal()` (dòng 364) để spawn
  `FastExecuteScript.exe`.
- `_closeTimeout` được dùng ở `runFunction()` (dòng 292) để delay resolve khi
  engine process đóng sớm (mặc định 60s, test rút xuống 100ms).

Test override hai property này bằng cách lưu giá trị gốc, gán giá trị mock,
và restore sau mỗi test (dòng 307-319 của `tests/connector.test.ts`).

Vấn đề là static public property là global state -- tất cả instance chia sẻ,
`@internal` JSDoc không ngăn được abuse, và bất kỳ code nào cũng có thể vô
tình ghi đè gây crash engine.

## Câu hỏi làm rõ

- Hỏi: Có cần giữ backward compatibility cho `_execFile` / `_closeTimeout` không?
  Trả lời: Không. Đây là `@internal` -- không ai dùng ngoài test module.
- Hỏi: `Connector` (file `src/plugin/connector/index.ts`) có cần expose thêm
  options để pass `execFile`/`closeTimeout` xuống không?
  Trả lời: Không. `Connector` dùng engine thật, không mock. Chỉ test cần inject.
- Hỏi: Có nên dùng `sinon.mock()` để tránh phải sửa production code không?
  Trả lời: Không. ESM live binding khiến mock `execFile` trực tiếp không khả thi,
  đã được thảo luận trong Issue #28.

## Các phương án

### Phương án 1: DI qua constructor (recommended)

Thêm `execFile` và `closeTimeout` vào `EngineOptions` interface.

```ts
export interface EngineOptions {
  cwd?: string;
  args?: string[];
  engineTimeout?: string | number;
  requestTimeout?: string | number;
  execFile?: typeof nodeExecFile;       // mới
  closeTimeout?: number;                // mới
}
```

`RemoteEngine` constructor lưu vào private fields, `#startProcessInternal()`
và `runFunction()` dùng `this.#execFile` / `this.#closeTimeout` thay vì
`RemoteEngine._execFile` / `RemoteEngine._closeTimeout`.

Xoá hai static property `_execFile` và `_closeTimeout` khỏi `RemoteEngine`.

Test tạo instance với `new RemoteEngine({ execFile: mockFn, closeTimeout: 100 })`.

- Ưu điểm:
  - Dependency explicit, không global state, type-safe.
  - Pattern nhất quán với `ConfigManager` (đã refactor từ module-level
    `AsyncLock` sang class instance).
  - An toàn khi multi-instance (mỗi instance có execFile riêng).
- Nhược điểm:
  - Phải sửa cả production code lẫn test code.
  - `Connector` constructor (`engine.ts:63-69`) pass options xuống -- cần đảm
    bảo không vô tình pass `execFile` từ bên ngoài.

### Phương án 2: Dùng sinon.mock() thay vì static property

Giữ production code sạch (không có `_execFile`, `_closeTimeout`).
Trong test, dùng sinon để mock `child_process.execFile` trực tiếp.

```ts
import sinon from 'sinon';
const execFileStub = sinon.stub(child_process, 'execFile').returns(mockProc);
```

- Ưu điểm:
  - Production code không cần sửa.
- Nhược điểm:
  - ESM live binding khiến việc này không khả thi với `tsx` runtime
    (đã xác nhận trong Issue #28: "ESM live binding immutable").
  - Phải thêm `sinon` vào devDependencies.
  - `_closeTimeout` vẫn phải xử lý riêng.

### Phương án 3: Hybrid -- constructor + static fallback

Giữ static property nhưng ưu tiên constructor options nếu được cung cấp.

```ts
class RemoteEngine {
  static _execFile = nodeExecFile;  // fallback
  #execFile: typeof nodeExecFile;

  constructor(options) {
    this.#execFile = options.execFile ?? RemoteEngine._execFile;
  }
}
```

- Ưu điểm:
  - Backward compatible -- test code cũ vẫn chạy.
- Nhược điểm:
  - Giữ lại static property (vẫn là global state, vẫn có thể bị abuse).
  - Phức tạp hơn khi có hai nguồn dependency.
  - Không giải quyết triệt để vấn đề.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (DI qua constructor).
  Lý do: triệt để, nhất quán với pattern hiện tại của dự án (`ConfigManager`),
  type-safe, không global state.

- **Phương án được chọn:** (người duyệt điền sau)

- **Ràng buộc:**
  - `connector/index.ts` không cần expose `execFile`/`closeTimeout` -- chỉ pass
    options đang có (cwd, engineTimeout, requestTimeout).
  - `execFile` và `closeTimeout` chỉ được inject từ test, không từ `Connector`.
  - Xoá `nodeExecFile` import nếu không còn chỗ nào dùng.
