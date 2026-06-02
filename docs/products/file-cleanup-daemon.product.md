# Product: File Cleanup Daemon

## Mô tả

File Cleanup Daemon tự động dọn dẹp file tạm do engine tạo ra (file `.ini`, process files). Nó chạy timer 15 giây quét thư mục engine, kiểm tra file nào còn được lock bởi process đang chạy, và chỉ xoá file đã hết hạn và không còn lock.

Mục đích: engine tạo nhiều file tạm trong quá trình hoạt động (settings, process tracking). Nếu không dọn, thư mục engine phình to theo thời gian.

## Cách sử dụng

Daemon hoạt động tự động — không cần cấu hình thủ công:

```ts
// Khi _launch() được gọi:
// 1. cleaner.watch(enginePwd) — đăng ký thư mục, khởi động timer
// 2. cleaner.ignore(pwd, pid, id) — lock file tạm
//
// Khi configure() được gọi:
// 3. cleaner.include(pwd, pid, id) — unlock file
//
// Khi cleanup() được gọi:
// 4. cleaner.stop() — clear timer, unlock toàn bộ
```

## Hành vi chi tiết

- Timer 15 giây chạy `.unref()` — không block Node.js process exit.
- Mỗi lần tick: quét thư mục `{t,s}/*`, kiểm tra mtime > 15 giây, kiểm tra lock (proper-lockfile), xoá file không lock.
- `ignore()` lock các file: `t/{pid}`, `s/{id}.ini`, `s/{id}1.ini`.
- `include()` unlock — gọi từ `configure()` khi engine đã setup xong.
- `stop()` clear timer và unlock toàn bộ file còn locked — gọi từ `cleanup()`.
- Debug log namespace: `browser-with-fingerprints:cleaner`.

## Giới hạn và điều kiện

- File không lock và mtime > 15 giây sẽ bị xoá vĩnh viễn.
- Yêu cầu quyền đọc/ghi trên thư mục engine.
- Chỉ hỗ trợ Windows (engine path là Windows path).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/file-cleanup-daemon.spec.md`
- Design: `docs/designs/file-cleanup-daemon.design.md`
- Source: `src/plugin/cleaner.ts`
