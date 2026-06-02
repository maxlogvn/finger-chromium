# Plan: API Connector

## Các bước thực hiện

- [x] **Bước 1: Tạo singleton RemoteEngine**
  - Khởi tạo `engine = new RemoteEngine()` với cwd, engineTimeout, requestTimeout từ env.
  - Đăng ký sự kiện 'beforeExtract' và 'beforeDownload' (in console.log).

- [x] **Bước 2: Tạo `api(name, params)` function**
  - Dùng `async-lock` với key `'client'` để đồng bộ.
  - Gọi `engine.runFunction(name, params)`.
  - Parse lỗi: nếu message chứa "key is missing" → throw `MissingKeyError`, nếu không → throw `PluginError`.
  - Trả về `result.response ?? result`.

- [x] **Bước 3: Tích hợp PCAP server**
  - Gọi `pcapServer.listen()` → lấy port → set `--mock-pcap-port=<port>` vào engine args.

- [x] **Bước 4: Export engine instance**
  - Export `engine` để các module khác có thể truy cập.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/connector/index.ts` | API Connector |
| `src/plugin/connector/utils.ts` | Notification helper |
| `src/plugin/connector/pcapServer/index.ts` | PCAP server |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Các import: `RemoteEngine`, `pcapServer`, `AsyncLock`, `MissingKeyError`, `PluginError`, `debug`.

## Ghi chú

- PerfectCanvas request có `requestTimeout = 0` (không giới hạn thời gian).
- `FINGERPRINT_TIMEOUT` có thể set qua env để override mặc định 300s.
- `notify` chỉ chạy khi thiếu key và không trong môi trường test.

---
