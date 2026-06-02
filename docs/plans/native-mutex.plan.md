# Plan: Native Mutex

## Các bước thực hiện

- [x] **Bước 1: Compile C++ addon**
  - Compile `mutex.cpp` cho win32-x64 và win32-ia32.
  - Output: `mutex.node` cho mỗi architecture.

- [x] **Bước 2: Tạo `src/plugin/mutex/index.ts`**
  - Load mutex.node bằng `createRequire`.
  - Xử lý lỗi nếu platform/arch không hỗ trợ.
  - Export `create` function.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/mutex/index.ts` | Native addon loader |
| `plugin/mutex/win32-x64/mutex.node` | Binary 64-bit (runtime) |
| `plugin/mutex/win32-ia32/mutex.node` | Binary 32-bit (runtime) |

## Kiểm tra

- `npm run lint` -- 0 errors.
- `mutex.node` files tồn tại trong thư mục đúng.

## Ghi chú

- Chỉ hỗ trợ Windows (win32).
- Cần build native addon riêng cho mỗi architecture.
- File .node không thể bundle -- cần copy vào dist.

---
