# Product: Native Mutex

## Tổng quan

Native Mutex tạo Windows named mutex -- một cơ chế đồng bộ ở cấp độ kernel -- cho engine binary. Engine dùng mutex để đảm bảo chỉ một instance của nó chạy tại một thời điểm.

Bạn không cần dùng Native Mutex trực tiếp. Nó được gọi tự động bởi FingerprintPlugin.

## Cách hoạt động

```
mutex.create('BASProcess')
    │
    └── Windows kernel tạo named mutex "BASProcess"
        │
        ├── Nếu chưa có → tạo mới
        └── Nếu đã có → engine dùng mutex hiện tại
```

## API

### `create(name)`

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `name` | `string` | Tên mutex (VD: `'BASProcess'`) |

```ts
import { create } from 'fingerprint-chromium-engine/plugin/mutex';

create('BASProcess');
// Windows named mutex "BASProcess" được tạo
```

## Xử lý lỗi

| Lỗi | Nguyên nhân |
|---|---|
| `Unsupported OS architecture` | Kiến trúc Windows không phải ia32/x64 |
| `Unsupported OS platform` | Hệ điều hành không phải Windows |

## Lưu ý

- **Chạy trên Windows** -- đây là native Windows API, không chạy trên Linux/macOS.
- **Cần file .node** -- mutex.node được compile sẵn cho win32-x64 và win32-ia32.
- **Tự động load** -- module chọn đúng .node file dựa trên `process.arch`.

---
