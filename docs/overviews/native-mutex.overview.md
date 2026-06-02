# Overview: Native Mutex

## Mục tiêu

Tạo Windows named mutex qua C++ addon (mutex.node) để engine binary đồng bộ truy cập tài nguyên.

## Kết quả

- `src/plugin/mutex/index.ts`: 48 dòng, loader cho mutex.node.
- Hỗ trợ win32-x64 và win32-ia32.
- Export `create()` function.
- Xử lý lỗi nếu platform/arch không hỗ trợ.

## Kiểm tra

- `npm run lint` -- 0 errors.
- .node files tồn tại trong 2 thư mục architecture.

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

- `createRequire(import.meta.url)` là cách chuẩn để load native addon từ ESM.
- `PACKAGE_PATH` = `path.resolve(__dirname, '../../../')` -- từ `mutex/index.ts` lên package root.
- Nếu mở rộng sang platform khác, cần compile mutex.cpp cho platform đó.

---
