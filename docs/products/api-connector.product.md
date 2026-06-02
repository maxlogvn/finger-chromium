# Product: API Connector

## Tổng quan

API Connector là lớp trung gian giữa FingerprintPlugin và RemoteEngine. Nó đảm bảo:
- Chỉ một request được gửi đến engine tại một thời điểm.
- Lỗi từ engine được chuyển thành `PluginError` / `MissingKeyError` dễ xử lý.
- PCAP server tự động khởi động khi connector được load.

Bạn không cần dùng API Connector trực tiếp -- nó chạy ngầm khi bạn gọi `Chromium.launch()`.

## Cách dùng (nội bộ)

Trong code của thư viện, các plugin gọi API Connector như sau:

```ts
import { api } from '../connector';

// Gọi setup engine với fingerprint, proxy, profile
const result = await api('setup', {
  fingerprint: { value: fingerprintData, options: { usePerfectCanvas: true } },
  key: 'your-private-key',
  pid: 12345,
  profile: { value: './profiles/user', options: { loadProxy: true } },
  proxy: { value: 'socks5://127.0.0.1:9050', options: { changeWebRTC: 'replace' } },
  version: 'default',
});
```

## API

### `api(name, params)`

Gọi một hàm trên engine binary.

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `name` | `string` | Tên hàm: `'setup'`, `'versions'`, `'get_bounds'`, `'get_defaults'` |
| `params` | `object` | Tham số truyền cho engine |

**Kết quả trả về:**
- `response` object từ engine (nếu có).
- Toàn bộ result nếu không có `response`.

**Lỗi:**
- `MissingKeyError` nếu engine báo thiếu key.
- `PluginError` cho các lỗi khác.
- `EngineTimeoutError` / `RequestTimeoutError` từ RemoteEngine.

## Lifecycle

```
Import connector
    │
    ├── Tạo singleton RemoteEngine
    ├── Start PCAP server (listen)
    └── Export engine + api function
                │
                ▼
FingerprintPlugin gọi api('setup', ...)
    │
    ├── Lock 'client' (chờ nếu có request khác)
    ├── engine.runFunction('setup', ...)
    ├── Parse result
    └── Unlock
```

## Xử lý lỗi

| Lỗi | Ý nghĩa |
|---|---|
| `MissingKeyError` | Chưa set `BABLOSOFT_KEY`. Engine từ chối phục vụ. |
| `PluginError` | Lỗi không xác định từ engine. Kiểm tra message. |
| `EngineTimeoutError` | Engine không start được. |
| `RequestTimeoutError` | Engine không phản hồi. |

## Môi trường

| Biến | Mô tả |
|---|---|
| `FINGERPRINT_CWD` | Thư mục làm việc của engine |
| `FINGERPRINT_TIMEOUT` | Timeout (ms) cho cả engine và request |

## Lưu ý

- **PCAP server tự động start** ở port có sẵn, không cần cấu hình thủ công.
- **Khi thiếu key**, connector hiển thị thông báo upgrade và delay 20s trước khi cảnh báo timeout.
- **Request PerfectCanvas** có thể không giới hạn thời gian (timeout = 0) nếu option `perfectCanvasRequest` được bật.
- **Chỉ một request tại một thời điểm** -- async-lock xếp hàng các request còn lại.

---
