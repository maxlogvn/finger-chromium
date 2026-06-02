# Plan: RemoteEngine

## Các bước thực hiện

- [x] **Bước 1: Tạo `src/plugin/connector/engine.ts`**
  - Tạo class `RemoteEngine extends EventEmitter`.
  - Implement `#updateMeta()`:
    - Đọc `project.xml`, parse `<EngineVersion>`.
    - Fetch metadata từ bablosoft.com (Checksum, Url).
    - Cache vào file `<version>_<ARCH>.json`.
  - Implement `#startProcessInternal()`:
    - Kiểm tra checksum SHA1, xoá engine cũ nếu sai.
    - Download zip (emit 'beforeDownload').
    - Extract zip (emit 'beforeExtract').
    - Copy project.xml, tạo settings.ini, worker_command_line.txt.
    - Spawn `FastExecuteScript.exe` với `--silent` flag.
  - Implement `#startProcess(timeout)` với Promise.race timeout.
  - Implement `runFunction(name, params)`:
    - Dọn request cũ (kill(pid, 0) → ESRCH).
    - Ghi JSON request file.
    - Watch by chokidar, đọc response, parse JSON.
  - Export constants: `CLOSE_TIMEOUT`, `DEFAULT_TIMEOUT`, `PROJECT_PATH`.

- [x] **Bước 2: Tạo `src/plugin/connector/index.ts`**
  - Singleton `RemoteEngine` instance.
  - Auto-start PCAP server, set args `--mock-pcap-port=<port>`.
  - `api(name, params)` wrapper với async-lock và error normalization.
  - Đăng ký sự kiện 'beforeDownload'/'beforeExtract'.

- [x] **Bước 3: Tạo `src/plugin/connector/utils.ts`**
  - Hàm `notify(key)` hiển thị thông báo upgrade khi thiếu key (chỉ 1 lần).

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/connector/engine.ts` | Core RemoteEngine |
| `src/plugin/connector/index.ts` | API connector (singleton) |
| `src/plugin/connector/utils.ts` | Notification helper |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Các error classes `EngineTimeoutError`, `InvalidEngineError`, `RequestTimeoutError` được import từ `../errors` và sử dụng.
- `chokidar`, `axios`, `extract-zip` có trong dependencies.

## Ghi chú

- `resolvePackageRoot()` đi ngược từ `__dirname` để tìm package root -- cần đảm bảo `package.json` luôn có `name: 'fingerprint-chromium-engine'`.
- `ARCH` được xác định từ `process.arch.includes('32')` -- dùng cho 32-bit và 64-bit.
- `FINGERPRINT_TIMEOUT` env dùng chung cho cả engineTimeout và requestTimeout.

---
