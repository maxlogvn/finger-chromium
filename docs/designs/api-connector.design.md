# Design: API Connector

## Vấn đề cần giải quyết

RemoteEngine cung cấp method `runFunction(name, params)` để gọi engine binary, nhưng người dùng (FingerprintPlugin) cần một interface cao hơn, có:
1. **Singleton:** Chỉ một RemoteEngine instance cho toàn bộ ứng dụng.
2. **Đồng bộ:** Không gọi engine cùng lúc (engine chỉ xử lý một request).
3. **Error normalization:** Chuyển lỗi thô từ engine thành `PluginError` / `MissingKeyError`.
4. **PCAP server integration:** Tự động khởi động PCAP server và truyền port cho engine.

## Giải pháp chọn

### Kiến trúc

```
FingerprintPlugin
    │
    ▼
api('setup', { fingerprint, proxy, profile })
    │
    ├── async-lock 'client' → đảm bảo chỉ 1 request
    │
    ├── engine.runFunction('setup', params)
    │       │
    │       ├── Thành công → return result.response
    │       └── Lỗi "key is missing" → throw MissingKeyError
    │           Lỗi khác → throw PluginError
    │
    └── clearTimeout(notifyTimer)
```

### Tại sao dùng async-lock?

Engine chỉ xử lý một request tại một thời điểm. Nếu có 2 request cùng lúc:
- Request 1: ghi file a.json
- Request 2: ghi file b.json (cùng lúc)
- Engine chỉ đọc được 1 file

async-lock với key `'client'` xếp hàng các request, đảm bảo chỉ một request được gọi `runFunction` tại một thời điểm.

### Tại sao auto-start PCAP server?

PCAP server cần chạy trước khi engine spawn, vì engine cần biết port để kết nối. Connector tự động start server và set `--mock-pcap-port=<port>` vào args của engine.

### Tại sao tự động notify khi thiếu key?

Khi dùng bản free (không có BABLOSOFT_KEY), engine vẫn hoạt động nhưng bị giới hạn. Connector hiển thị thông báo upgrade và cảnh báo delay -- chỉ một lần duy nhất (dùng `once()`).

---
