# Plan: Native Mutex

- [x] Bước 1: Build mutex.node C++ addon cho win32-x64 và win32-ia32
  - Native C++ addon dùng CreateMutex Windows API
  - Prebuilt binary trong `src/plugin/mutex/win32-{arch}/mutex.node`

- [x] Bước 2: Implement module loader -- createRequire + arch detection
  - `process.arch` → 'x64' hoặc 'ia32'
  - `createRequire(__filename)` để load .node addon từ ESM context
  - Throw detailed error nếu platform không phải win32

- [x] Bước 3: Export create() function -- tạo named mutex
  - Mutex name: `BASProcess${pid}`
  - Windows kernel tự động release mutex khi process kết thúc
  - Không cần close() -- nhưng nếu cần explicit release, phải thêm CloseHandle trong C++

- [x] Bước 4: Tích hợp vào `FingerprintPlugin._launch()`
  - Gọi `mutex.create('BASProcess' + response.pid)` sau khi api('setup') thành công
  - Mutex đảm bảo chỉ một process dùng profile -- cross-process safety
