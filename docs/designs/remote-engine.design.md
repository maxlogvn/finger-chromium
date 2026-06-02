# Design: RemoteEngine

## Vấn đề

Cần giao tiếp với `FastExecuteScript.exe` (engine binary của bablosoft) để setup browser với fingerprint. Engine binary này chạy dưới dạng child process, giao tiếp qua file-based IPC, không phải stdin/stdout.

## Giải pháp: RemoteEngine class

### Quy trình khởi tạo engine

1. **Update metadata**: Đọc `project.xml` để lấy version engine, fetch metadata JSON từ bablosoft (`http://bablosoft.com/distr/FastExecuteScript${ARCH}/${version}/FastExecuteScript.x${ARCH}.zip.meta.json`), lưu cache vào `cwd/<version>_<ARCH>.json`.

2. **Download**: Nếu thư mục engine chưa tồn tại, tải zip từ URL trong metadata. Verify SHA1 checksum của file zip sau khi tải.

3. **Extract**: Nếu thư mục script chưa tồn tại, giải nén zip bằng `extract-zip`, copy `project.xml`, tạo `worker_command_line.txt` (nội dung: `--mock-connector`) và `settings.ini` (nội dung: `RunProfileRemoverImmediately=true`).

4. **Checksum verification**: Nếu zip có sẵn nhưng checksum không khớp, xoá toàn bộ thư mục engine và tải lại từ đầu. Tránh dùng engine corrupt.

### File-based IPC

Engine binary giao tiếp qua file trên ổ cứng, không qua pipe:
- Request: `r/<pid>_<uuid>.json` chứa `{ name: string, params: object }`
- Response: Ghi đè nội dung file request JSON bởi engine
- Watch: Dùng `chokidar` với `awaitWriteFinish: true` để tránh đọc file chưa ghi xong

### PID-based cleanup

Trước mỗi request, quét thư mục `r/`, kiểm tra PID từ tên file (`<pid>_<uuid>.json`). Nếu PID không còn tồn tại (kill(pid, 0) trả ESRCH), xoá file request cũ. Tránh tích tụ file rác.

### Timeout cơ chế

- `engineTimeout`: timeout cho việc start process (download + extract + execFile). Dùng `Promise.race`.
- `requestTimeout`: timeout cho từng request IPC. Dùng `setTimeout` reject.

Nếu engine process đóng khi đang chờ response, chờ thêm 60s graceful timeout rồi mới reject.

---

Xem thêm: [Spec](../specs/remote-engine.spec.md) | [Plan](../plans/remote-engine.plan.md)
