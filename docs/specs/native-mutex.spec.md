# Spec: Native Mutex

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Native Mutex cung cấp Windows named mutex thông qua C++ addon (`mutex.node`). Mutex dùng cho `worker.exe` (BAS process) để đồng bộ truy cập tài nguyên dùng chung giữa các process — tránh xung đột khi nhiều instance fingerprint cùng chạy.

Source: `src/plugin/mutex/index.ts` (63 dòng).

## Yêu cầu

- `create(name)` — tạo Windows named mutex.
- `release(name)` — release mutex (nếu native addon hỗ trợ close method).
- `resolvePackageRoot()` walk-up algorithm để tìm thư mục `mutex.node` sau tsup bundle.
- Load native module từ `PACKAGE_PATH/plugin/mutex/{platform}-{arch}/mutex.node`.
- Hỗ trợ win32 32-bit (ia32) và 64-bit (x64).
- Error handling cho architecture không hỗ trợ.

## Thiết kế

### Kiến trúc

```
mutex/index.ts
  │
  ├─ resolvePackageRoot(__dirname)
  │    └─ Walk up → tìm package.json → return PACKAGE_PATH
  │
  ├─ requireNative(PACKAGE_PATH/plugin/mutex/win32-x64/mutex.node)
  │    ├─ [OK] → export mutex module
  │    └─ [FAIL] → throw Error với kiến trúc không hỗ trợ
  │
  ├─ create(name) → mutex.create(name)
  ├─ release(name) → mutex.close?.(name) (nếu có)
  └─ export default mutex
```

### Package Root Resolution

`resolvePackageRoot(startDir)` walk ngược từ `__dirname` của mutex module đến khi tìm thấy `package.json` có `name === 'fingerprint-chromium-engine'`. Đảm bảo đường dẫn `mutex.node` luôn đúng sau tsup bundle.

### Windows kernel auto-cleanup

Windows kernel tự động giải phóng handle named mutex khi process thoát — không lo memory leak. Do đó, `release()` có thể không cần gọi native close. Tuy nhiên, module vẫn check `typeof mutex.close === 'function'` để gọi nếu native addon hỗ trợ.

Tham chiếu design doc: `docs/designs/native-mutex.design.md`.

## API / Data flow

```ts
import mutex, { create, release } from '../../plugin/mutex';

// Tạo mutex — gọi sau khi engine setup thành công
create('BASProcess12345');

// ... worker.exe chạy, dùng mutex để đồng bộ ...

// Release mutex — gọi khi cleanup
release('BASProcess12345');

// Không gọi release cũng không sao — kernel tự cleanup khi process thoát
```

### Input

- `create(name: string)` — tên mutex (thường là `BASProcess<pid>`).
- `release(name: string)` — tên mutex cần release.

### Output

- void.

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/mutex/index.ts` | Native addon wrapper | 63 |
| `src/plugin/mutex/win32-ia32/mutex.node` | Addon 32-bit | — |
| `src/plugin/mutex/win32-x64/mutex.node` | Addon 64-bit | — |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Architecture không hỗ trợ (not win32, not ia32/x64) | Throw `PluginError('Unsupported OS architecture for named mutex.')` chi tiết |
| Platform không phải win32 | Throw `PluginError('Unsupported OS platform for named mutex.')` |
| Load native module fail (file không tồn tại) | Catch error, log `console.error` với detail, throw |
| Native addon không có method `close` | `release()` skip silently — kernel tự cleanup |
| `resolvePackageRoot` không tìm thấy | Throw `PluginError('[Mutex] Không tìm thấy thư mục gốc...')` |

## Kiểm tra

- Happy path: `create('BASProcessTest')` không throw.
- Release: `release('BASProcessTest')` không throw (dù có hoặc không có native close).
- Error: kiến trúc không hỗ trợ → throw Error với message rõ ràng.
- Error: platform không phải win32 → throw Error.
- Walk-up: `resolvePackageRoot` tìm đúng package root từ `__dirname`.
