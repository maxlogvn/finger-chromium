# Spec: RemoteEngine

## Mô tả

Quản lý vòng đời engine binary: download, verify, extract, spawn, IPC.

## API

| Method | Mô tả |
|---|---|
| `setCwd(value)` | Thư mục làm việc |
| `setArgs(value)` | Args cho process |
| `setEngineTimeout(value)` | Timeout khởi động |
| `setRequestTimeout(value)` | Timeout request |
| `runFunction(name, params)` | Gọi hàm qua IPC |

## IPC Flow

1. Tạo file JSON request trong thư mục `r/`
2. Chokidar watch file change
3. Engine ghi response vào cùng file
4. Parse JSON, trả kết quả

## Xử lý lỗi

- Timeout: `RequestTimeoutError` / `EngineTimeoutError`
- Engine die: `InvalidEngineError`
- Sai checksum: tự động xoá và tải lại

---

Xem thêm: [Design](../designs/remote-engine.design.md) | [Plan](../plans/remote-engine.plan.md)
