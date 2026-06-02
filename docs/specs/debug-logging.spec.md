# Spec: Debug Logging

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Debug logging dùng thư viện `debug` với namespace theo từng module. Mỗi module có namespace riêng, dễ bật/tắt qua biến môi trường `DEBUG`. Zero overhead khi không dùng — `debug` package tự động no-op nếu không có namespace match.

Source: toàn bộ file dùng `debugFactory`.

## Yêu cầu

- Namespace convention: `browser-with-fingerprints:<module>`.
- Sub-namespace cho module con: `browser-with-fingerprints:<module>:<sub>`.
- Zero overhead khi DEBUG không set — `debug` package tự tắt.
- Log ra stderr — không ảnh hưởng stdout (quan trọng cho test).
- Format output: `namespace message +elapsed-time`.

## Thiết kế

### Pattern

Mỗi file tạo debug instance ở đầu module:

```ts
import createDebug from 'debug';
const debug = createDebug('browser-with-fingerprints:connector');
```

Gọi log:

```ts
debug('PCAP server dang lang nghe tai port %d', port);
// Output:
// browser-with-fingerprints:connector PCAP server dang lang nghe tai port 54321 +10500ms
```

`debug` tự động thêm `+elapsed-time` (ms từ khi process start) — hữu ích để đo hiệu năng.

Tham chiếu design doc: `docs/designs/debug-logging.design.md`.

## API / Data flow

### Namespace map

| Namespace | File | Số log | Loại log |
|---|---|---|---|
| `browser-with-fingerprints:connector` | `src/plugin/connector/index.ts` | 1 | PCAP server listening |
| `browser-with-fingerprints:connector:engine` | `src/plugin/connector/engine.ts` | 12 | IPC request/response, download, extract, spawn, metadata |
| `browser-with-fingerprints:connector:pcapServer` | `src/plugin/connector/pcapServer/index.ts` | 1 | Socket error handler |
| `browser-with-fingerprints:cleaner` | `src/plugin/cleaner.ts` | 1 | Lock compromised warning |

### Bật/tắt

```bash
# Windows CMD — tất cả namespace
set DEBUG=browser-with-fingerprints:* & node app.js

# PowerShell
$env:DEBUG='browser-with-fingerprints:*'; node app.js

# Chỉ engine namespace
$env:DEBUG='browser-with-fingerprints:connector:engine'; node app.js

# Nhiều namespace
$env:DEBUG='browser-with-fingerprints:connector,browser-with-fingerprints:cleaner'; node app.js

# Tắt (mặc định)
$env:DEBUG=''; node app.js
```

### Ví dụ output

```
browser-with-fingerprints:connector:engine Dang tai browser... +0ms
browser-with-fingerprints:connector:downloading...
browser-with-fingerprints:connector:engine Engine giai nen thanh cong... +5342ms
browser-with-fingerprints:connector:engine Dang goi method "setup"... +10234ms
browser-with-fingerprints:connector PCAP server dang lang nghe tai port 54321 +11000ms
browser-with-fingerprints:connector:engine Da nhan ket qua tu engine thanh cong... +15234ms
```

## Components

| File | Namespace | Số log |
|---|---|---|
| `src/plugin/connector/index.ts` | `browser-with-fingerprints:connector` | 1 |
| `src/plugin/connector/engine.ts` | `browser-with-fingerprints:connector:engine` | 12 |
| `src/plugin/connector/pcapServer/index.ts` | `browser-with-fingerprints:connector:pcapServer` | 1 |
| `src/plugin/cleaner.ts` | `browser-with-fingerprints:cleaner` | 1 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| DEBUG không set | Logger là no-op — không ảnh hưởng performance |
| DEBUG set sai namespace | Logger là no-op — không throw |
| Output stderr | stdout không bị ảnh hưởng — redirect stdout vẫn hoạt động |

## Kiểm tra

- Set `$env:DEBUG='browser-with-fingerprints:*'` → chạy app → kiểm tra stderr có log.
- Set `$env:DEBUG=''` → chạy app → không có output debug.
- Set namespace cụ thể → chỉ log module đó.
