# Plan: Test Connector (RemoteEngine + Connector + PCAP)

## Các bước thực hiện

- [ ] Bước 1: Tạo file test và cấu trúc describe/import cơ bản
    - Làm gì: Tạo `tests/connector.test.ts` với 3 `describe` blocks (PCAP Server, RemoteEngine, Connector). Import `describe`, `it` từ mocha và `strictEqual`, `ok`, `rejects`, `doesNotThrow` từ `node:assert`.
    - File liên quan: `tests/connector.test.ts`
    - Ghi chú: Dùng đúng pattern của `tests/utils.test.ts`.

- [ ] Bước 2: Viết PCAP Server tests — listen + close
    - Làm gì: Test `listen()` trả về port > 0, test `close()` dừng server, kiểm tra `unref()` không giữ event loop (process tự thoát sau test).
    - File liên quan: `tests/connector.test.ts`, `src/plugin/connector/pcapServer/index.ts`
    - Phụ thuộc: Bước 1.

- [ ] Bước 3: Viết PCAP Server tests — request ID (0x01) + heartbeat (0x07)
    - Làm gì: Mở TCP socket đến PCAP server, gửi buffer `[0x01]`, verify response format. Gửi `[0x07]`, verify heartbeat response.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 2.

- [ ] Bước 4: ~~Viết PCAP Server tests — EADDRINUSE retry~~ (BỎ)
    - Lý do: `listen()` dùng `once()` wrapper — chỉ chạy callback một lần, không thể test retry logic.
    - File liên quan: `tests/connector.test.ts`
    - Deviation: Xem overview `test-connector.overview.md`.

- [ ] Bước 5: Viết RemoteEngine tests — constructor + setters
    - Làm gì: Test constructor với default options (kiểm tra `#cwd`, `#engineTimeout`, `#requestTimeout` qua getter). Test `setCwd`, `setArgs`, `setEngineTimeout`, `setRequestTimeout`. Cần mock `resolvePackageRoot` để tránh lỗi `PROJECT_PATH`. Dùng dynamic import + override `__dirname` hoặc mock `require`.
    - File liên quan: `tests/connector.test.ts`, `src/plugin/connector/engine.ts`
    - Phụ thuộc: Bước 1.

- [ ] Bước 6: Viết RemoteEngine tests — helpers (exists, checksum, download)
    - Làm gì: Test `exists()` với file temp thật (dùng `fs.mkdtemp` + `fs.writeFile`). Test `checksum()` với nội dung biết trước SHA1. Test `download()`: mock `axios.get` trả về stream, kiểm tra file được tạo; test HTTPS fail + HTTP fallback; test download fail cleanup `.tmp`.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 5.

- [ ] Bước 7: Viết RemoteEngine tests — runFunction() với mock IPC
    - Làm gì: Mock `#updateMeta()`, `#startProcess()` để tránh fetch/spawn thật. Test flow: request file → chokidar watch → response → parse JSON. Tạo file response JSON thật để chokidar detect change.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 6.

- [ ] Bước 8: Viết RemoteEngine tests — runFunction() edge cases
    - Làm gì: Test request timeout → `RequestTimeoutError`; mock process crash → error message; response JSON parse fail → `{ error: 'Invalid response format' }`.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 7.

- [ ] Bước 9: Viết RemoteEngine tests — kill()
    - Làm gì: Mock `ChildProcess` với `kill()`, `once('exit')`, `killed`, `exitCode`. Test kill process đang chạy, kill process đã killed (no-op).
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 5.

- [ ] Bước 10: Viết Connector tests — constructor + setters
    - Làm gì: Dynamic import Connector với cache cleared. Test constructor truyền options xuống RemoteEngine (kiểm tra qua `requestTimeout` getter). Test `setCwd`, `setRequestTimeout`, `setEngineTimeout`.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 1.

- [ ] Bước 11: Viết Connector tests — api() happy path + error normalization
    - Làm gì: Mock `RemoteEngine.prototype.runFunction` để trả về response. Test `api()` gọi `runFunction` và trả về `result.response`. Test error 'key is missing' → `MissingKeyError`. Test error khác → `PluginError`.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 10.

- [ ] Bước 12: Viết Connector tests — api() edge cases
    - Làm gì: Test `perfectCanvasRequest: true` → `requestTimeout = 0`. Test `api()` với `params` chứa `options`, `key`.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 11.

- [ ] Bước 13: Viết Connector tests — cleanup()
    - Làm gì: Mock `RemoteEngine.prototype.kill` → kiểm tra nó được gọi. Test `cleanup()` không throw.
    - File liên quan: `tests/connector.test.ts`
    - Phụ thuộc: Bước 10.

- [ ] Bước 14: Chạy kiểm tra — lint + typecheck + test
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, `npm test` — sửa lỗi nếu có.
    - Phụ thuộc: Tất cả bước trên.

## Kiểm tra

Các lệnh cần chạy để xác nhận kết quả sau khi code xong:
- `npm run lint` — ESLint + Prettier pass
- `npm run typecheck` — TypeScript type check pass (tsc --noEmit)
- `npm test` — tất cả test (cũ + mới) pass

## Ghi chú

- **ESM module cache:** Ban đầu định dùng `require.cache` để reset `initPromise` trong Connector, nhưng ESM không hỗ trợ `require.cache`. Giải pháp thực tế: import Connector trực tiếp, PCAP server dùng `once()` nên chỉ init một lần — không ảnh hưởng test.
- **Mock chokidar:** Không test `runFunction()` trực tiếp vì `#process`, `#meta` là JS native private fields — không thể mock. Chỉ test gián tiếp qua Connector mock.
- **Mock execFile:** Trả về một EventEmitter với `pid`, `killed`, `exitCode` properties. Dùng `process.nextTick` để simulate async behavior.
- **`resolvePackageRoot` trong constructor RemoteEngine:** Hàm này throw nếu không tìm thấy package.json. Để test constructor mà không cần file thật, cần mock `require` hoặc dùng `__dirname` override.
- **Không thêm sinon/proxyquire:** Mock thủ công hoàn toàn.
