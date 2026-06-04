# Spec: Refactor static property `_execFile` và `_closeTimeout` sang DI

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Chuyển `RemoteEngine._execFile` và `RemoteEngine._closeTimeout` từ static
public property sang constructor Dependency Injection để loại bỏ global state,
tăng type safety và ngăn abuse ngoài ý muốn.

Tham chiếu design: `docs/designs/bug-034-static-property-di.design.md`

## Yêu cầu

- `_execFile` không còn là static public property của `RemoteEngine`.
- `_closeTimeout` không còn là static public property của `RemoteEngine`.
- `execFile` và `closeTimeout` được inject qua constructor options (`EngineOptions`).
- `#startProcessInternal()` dùng `this.#execFile` thay vì `RemoteEngine._execFile`.
- `runFunction()` dùng `this.#closeTimeout` thay vì `RemoteEngine._closeTimeout`.
- `Connector` (production code) không bị ảnh hưởng -- không cần thay đổi cách
  tạo `RemoteEngine`.
- Test dùng `new RemoteEngine({ execFile: mockFn, closeTimeout: 100 })` thay vì
  gán `RemoteEngine._execFile = ...`.
- Tất cả 162+ test hiện tại vẫn pass sau khi refactor.

## Thiết kế

```
EngineOptions (mở rộng)
├── cwd?: string
├── args?: string[]
├── engineTimeout?: string | number
├── requestTimeout?: string | number
├── execFile?: typeof nodeExecFile      ← mới
└── closeTimeout?: number               ← mới

RemoteEngine
├── #execFile: typeof nodeExecFile       ← private field từ constructor
├── #closeTimeout: number               ← private field từ constructor
├── #startProcessInternal()             ← dùng this.#execFile
└── runFunction()                       ← dùng this.#closeTimeout
```

## API / Data flow

**Trước:**
```ts
// Production
const proc = RemoteEngine._execFile(exePath, args, opts, cb);

// Test
RemoteEngine._execFile = mockFn;
```

**Sau:**
```ts
// Production — constructor (mặc định)
this.#execFile = options.execFile ?? nodeExecFile;

// Production — dùng trong #startProcessInternal()
const proc = this.#execFile(exePath, args, opts, cb);

// Test — inject mock
const engine = new RemoteEngine({ execFile: mockFn, closeTimeout: 100 });
```

**Luồng constructor mới:**
1. Gán `this.#execFile = options.execFile ?? nodeExecFile`
2. Gán `this.#closeTimeout = options.closeTimeout ?? CLOSE_TIMEOUT`
3. Các setter và gán khác giữ nguyên

## Components

| File | Thay đổi |
|------|----------|
| `src/plugin/connector/engine.ts` | Sửa `EngineOptions` (thêm `execFile`, `closeTimeout`). Thêm 2 private fields `#execFile`, `#closeTimeout`. Sửa constructor. Xoá `_execFile`, `_closeTimeout`. Sửa `#startProcessInternal()` dùng `this.#execFile`. Sửa `runFunction()` dùng `this.#closeTimeout`. |
| `tests/connector.test.ts` | Sửa test: thay `RemoteEngine._execFile = ...` bằng `new RemoteEngine({ execFile: ... })`. Thay `RemoteEngine._closeTimeout = ...` bằng `new RemoteEngine({ closeTimeout: ... })`. Bỏ `origExecFile`/`origCloseTimeout` save/restore. |

## Xử lý lỗi

- `execFile` không hợp lệ (không phải function) -- TypeScript bắt ở compile time
  nhờ kiểu `typeof nodeExecFile`. Runtime mặc định fallback về `nodeExecFile`.
- Không có case lỗi đặc biệt nào khác vì đây là refactor thuần (không thay đổi
  logic).

## Kiểm tra

### Test hiện tại bị ảnh hưởng (trong `tests/connector.test.ts`)

6 test cases trong `describe('RemoteEngine.runFunction()')` cần sửa:

| Test | Thay đổi |
|------|----------|
| parse response JSON thành công | `new RemoteEngine({ cwd, execFile: mockFn })` |
| throw RequestTimeoutError | `new RemoteEngine({ cwd, execFile: mockFn })` |
| không set timeout khi requestTimeout=0 | `new RemoteEngine({ cwd, execFile: mockFn })` |
| response không phải JSON | `new RemoteEngine({ cwd, execFile: mockFn })` |
| engine process đóng trước response | `new RemoteEngine({ cwd, execFile: mockFn, closeTimeout: 100 })` |
| xoá file request cũ | `new RemoteEngine({ cwd, execFile: mockFn })` |

### Xác nhận không có test nào khác bị ảnh hưởng

Grep toàn bộ codebase tìm `RemoteEngine._execFile` và `RemoteEngine._closeTimeout`
-- chỉ còn trong `tests/connector.test.ts`.
