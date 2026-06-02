# Product: Debug Logging

## Tổng quan

Structured logging với `debug` package. Mỗi module có namespace riêng, dễ bật/tắt.

## Cách bật

```bash
# Bật tất cả
set DEBUG=fingerprint:* & node app.js

# Chỉ connector
set DEBUG=fingerprint:connector & node app.js

# Nhiều module
set DEBUG=fingerprint:connector,fingerprint:plugin & node app.js
```

## Namespaces

| Namespace | Log gì | File chính |
|---|---|---|
| `fingerprint:connector` | Download, extract, IPC request/response | `connector/engine.ts`, `connector/index.ts` |
| `fingerprint:plugin` | Lifecycle: launch, setup, cleanup | `plugin/index.ts` |
| `fingerprint:adapter` | BrowserEngine methods, viewport resize | `adapter/playwright/*.ts` |

## Ví dụ output

```
fingerprint:connector Dang tai browser... +0ms
fingerprint:connector Dang cai dat browser... +5342ms
fingerprint:plugin _launch: setup response OK +10234ms
fingerprint:adapter setViewport: resize 1920x1080 delta={16,88} +11000ms
fingerprint:adapter [HookBinding] Khong the thay doi viewport: kich thuoc da bi khoa boi fingerprint +12000ms
```

## Tích hợp npm scripts

```bash
npm run dev    # Chạy với DEBUG=fingerprint:* (package.json)

# Hoặc set env trước
set DEBUG=fingerprint:* && npm run dev
```

## Lưu ý

- `debug` tự động thêm timestamp (elapsed time từ process start)
- Mỗi namespace một màu khác nhau trong terminal
- Zero overhead khi tắt (DEBUG không set) -- logger là no-op function
- Trên Windows, dùng `set` thay `export`
