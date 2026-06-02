# Overview: Native Mutex

## Tóm tắt

Đã triển khai Windows named mutex qua native C++ addon (`mutex.node`). Hỗ trợ win32 32-bit + 64-bit. Dùng `resolvePackageRoot()` walk-up algorithm để tìm addon path sau tsup bundle.

## Kiến trúc

```
NativeMutex (src/plugin/mutex/index.ts)
  |-- resolvePackageRoot()      walk-up tìm package root
  |     |-- __dirname -> path.join up tối đa 10 levels
  |     |-- tìm node_modules/browser-with-fingerprints-engine
  |
  |-- getMutexPath()            platform-arch path
  |     |-- win32-x64 -> mutex/win64/mutex.node
  |     |-- win32-ia32 -> mutex/win32/mutex.node
  |
  |-- mutex = require(mutexPath)  native addon
  |-- create(name)              Windows CreateMutex
  |-- release(name)            Windows CloseHandle
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `resolvePackageRoot()` | `src/plugin/mutex/index.ts` | 15-30 |
| `getMutexPath()` | `src/plugin/mutex/index.ts` | 32-45 |
| Load native addon | `src/plugin/mutex/index.ts` | 47-55 |
| `create()` | `src/plugin/mutex/index.ts` | 57-70 |
| `release()` | `src/plugin/mutex/index.ts` | 72-85 |

## Quyết định thiết kế

- **Native C++ addon**: JavaScript không có API tạo Windows named mutex. Dùng `node-gyp` build C++ addon gọi `CreateMutexW` / `CloseHandle`.
- **`resolvePackageRoot()`**: `__dirname` thay đổi sau tsup bundle. Walk-up algorithm tìm `node_modules/browser-with-fingerprints-engine` -- up tối đa 10 levels.
- **Platform-arch path**: `mutex/win64/mutex.node` (64-bit) và `mutex/win32/mutex.node` (32-bit). Dùng `process.arch` để detect.
- **Windows kernel auto-cleanup**: Nếu process crash, Windows kernel tự động release mutex handle. Không cần lo cleanup khi crash.
- **`release()` skip silently nếu không có `close()` method**: Native addon có version cũ không export `close()` -- không throw, chỉ warning.

## Flow create/release

```
create('browser-with-fingerprints-engine')
  -> resolvePackageRoot() -> find package root
  -> getMutexPath() -> resolve platform-arch path
  -> require(mutexPath) -> load native addon
  -> mutex.CreateMutexW(name) -> tạo/Open named mutex
  -> return success (true/false)

release('browser-with-fingerprints-engine')
  -> kiểm tra mutex.close method có tồn tại
  -> mutex.CloseHandle(name) -> release mutex
```

## Edge cases

- Package root không tìm thấy (user cài sai) -> throw `InvalidEngineError`.
- Native addon load fail (`module not found`) -> throw `PluginError`.
- `CreateMutexW` fail (ERROR_ACCESS_DENIED) -> return false.
- `release()` gọi khi mutex không tồn tại -> skip silently.

## Lưu ý

- Chỉ hỗ trợ Windows (win32 platform).
- Resolve path fix (KNOWN_ISSUES.md #6): hardcoded path bị sai sau tsup bundle -- đã fix bằng `resolvePackageRoot()`.
- Mutex dùng để đồng bộ truy cập engine binary -- tránh hai instance dùng cùng lúc.

## Tài liệu liên quan

- `docs/designs/native-mutex.design.md`
- `docs/specs/native-mutex.spec.md`
- `docs/plans/native-mutex.plan.md`
- `docs/products/native-mutex.product.md`
- `src/plugin/mutex/index.ts`
