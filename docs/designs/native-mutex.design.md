# Design: Native Mutex

## Vấn đề

Cần đồng bộ truy cập tài nguyên ở cấp độ system -- ngăn nhiều instance browser dùng chung profile cùng lúc.

## Giải pháp

Native C++ addon (`mutex.node`) tạo Windows named mutex.
- `create(name)` → tạo mutex với tên
- `close(name)` → giải phóng
- Hỗ trợ win32 32-bit + 64-bit

## Tại sao native?

- `async-lock` chỉ đồng bộ trong process, không cross-process
- `proper-lockfile` lock file, chậm hơn
- Named mutex nhanh, đúng cấp độ system

---

Xem thêm: [Spec](../specs/native-mutex.spec.md) | [Plan](../plans/native-mutex.plan.md)
