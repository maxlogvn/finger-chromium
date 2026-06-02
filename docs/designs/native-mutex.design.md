# Design: Native Mutex

## Vấn đề cần giải quyết

Engine binary (FastExecuteScript.exe) yêu cầu một Windows named mutex để đồng bộ truy cập tài nguyên (profile, port, ...). JavaScript không thể tạo named mutex -- cần native C++ code.

Giải pháp: một C++ addon nhỏ (`mutex.node`) được compile riêng cho win32 32-bit và 64-bit.

## Giải pháp chọn

### Kiến trúc

```
mutex/index.ts
    │
    ├── Load mutex.node từ thư mục plugin/mutex/{platform}-{arch}/
    │       ├── win32-x64/mutex.node
    │       └── win32-ia32/mutex.node
    │
    └── Export create() function
```

### Tại sao dùng native addon?

`async-lock` và `proper-lockfile` không thể tạo Windows named mutex -- chúng chỉ lock ở cấp độ JavaScript hoặc file hệ thống. Engine yêu cầu Windows kernel mutex, chỉ có thể tạo qua native API (`CreateMutexW`).

### Tại sao có 2 file .node?

Windows có 2 kiến trúc: 32-bit (ia32) và 64-bit (x64). C++ addon phải được compile riêng cho từng kiến trúc vì binary format khác nhau.

### Tại sao dùng `createRequire`?

`mutex/index.ts` là ESM (type: module). Để require một .node file, cần tạo `require` function từ ESM context bằng `createRequire(import.meta.url)`.

### Xử lý lỗi

Nếu không load được mutex.node:
- Windows sai kiến trúc: throw `Error` với message kiến trúc không được hỗ trợ.
- Platform không phải Windows: throw `Error` với message platform không được hỗ trợ.

---
