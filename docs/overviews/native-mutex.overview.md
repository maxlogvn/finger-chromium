# Overview: Native Mutex

File: `src/plugin/mutex/index.ts` (48 dòng).

## Lưu ý kỹ thuật

- Native module dùng `createRequire` thay vì `require` trực tiếp vì file là ESM. `createRequire` từ `node:module` cho phép require CJS addon từ ESM context.
- Chỉ hỗ trợ win32. Nếu chạy trên Linux/Mac, native addon không load được và throw error.
- `mutex.create()` không trả về handle -- Windows named mutex là kernel object, tự động giải phóng khi process exit. Nếu cần explicit release, cần thêm `CloseHandle` trong C++ addon.
- Hiện tại `mutex.create` chỉ tạo mutex chứ không có cơ chế kiểm tra mutex đã tồn tại hay chưa. Nếu mutex đã tồn tại, `CreateMutex` Windows API vẫn trả về handle (không block) -- chỉ block khi gọi `WaitForSingleObject`.
