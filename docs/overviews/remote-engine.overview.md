# Overview: RemoteEngine

## Mục tiêu

Xây dựng module quản lý vòng đời của engine binary FastExecuteScript.exe: tải xuống, xác thực, giải nén, cấu hình, spawn, và giao tiếp qua file-based IPC.

## Kết quả

- `src/plugin/connector/engine.ts`: 373 dòng, class `RemoteEngine extends EventEmitter`.
- `src/plugin/connector/index.ts`: 90 dòng, singleton connector với async-lock.
- `src/plugin/connector/utils.ts`: 40 dòng, notification helper.
- File-based IPC hoạt động ổn định: ghi JSON request, chokidar watch response.
- Checksum SHA1 được verify trước khi dùng engine.

## Kiểm tra

- `npm run lint` -- 0 errors.
- Các error classes được import đúng.
- `chokidar`, `axios`, `extract-zip` có trong dependencies.

## Sai lệch so với kế hoạch

| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| `resolvePackageRoot` dùng `__dirname` cố định | Dùng vòng lặp đi ngược tìm package.json | Đảm bảo đúng kể cả khi bundle vào dist/ |
| Dùng `fs.watch` cho IPC | Dùng `chokidar` | chokidar ổn định hơn, hỗ trợ `awaitWriteFinish` |
| Không có timeout cho process close | Thêm `CLOSE_TIMEOUT = 60s` và handler 'close' | Engine có thể đóng bất ngờ, cần chờ trước khi kết luận |

## Ghi chú kỹ thuật

- `project.xml` được copy từ `PACKAGE_ROOT` vào thư mục script mỗi lần start -- đảm bảo luôn có file cấu hình mới nhất.
- `settings.ini` chứa `RunProfileRemoverImmediately=true` -- engine tự động xoá profile tạm khi kết thúc.
- `worker_command_line.txt` chứa `--mock-connector` -- chế độ giả lập connector.
- `createRequire(import.meta.url)` dùng để require package.json từ ESM context.

---
