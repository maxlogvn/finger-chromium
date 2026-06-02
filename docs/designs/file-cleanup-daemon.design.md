# Design: File Cleanup Daemon

## Vấn đề

Thư mục làm việc của engine (`data/t/`, `data/s/`) tích tụ file rác sau nhiều lần chạy (temp files, orphaned request files). Cần dọn dẹp tự động mà không xoá file đang dùng.

## Giải pháp: SettingsCleaner class

Singleton pattern với private fields (#).

### Quy trình cleanup

1. **Watch folder**: `cleaner.watch(pwd)` đăng ký thư mục cần dọn
2. **Ignore (lock)**: `cleaner.ignore(pwd, pid, id)` khoá file của process đang chạy
3. **Include (unlock)**: `cleaner.include(pwd, pid, id)` mở khoá khi process kết thúc
4. **Cleanup timer**: Mỗi 15s quét các thư mục đã watch

### Lock file mechanism

Dùng `proper-lockfile` để lock/unlock. Lock file trên các items:
```
t/${pid}
s/${id}.ini
s/${id}1.ini
```

### Cleanup logic

```ts
#cleanup():
  1. Glob {t,s}/* trong mỗi watched folder
  2. Filter: bỏ qua file modified trong 15s gần nhất
  3. Với file .txt: kiểm tra lock trên file .ini tương ứng
  4. Với file khác: kiểm tra lock trực tiếp
  5. Nếu không locked → rm(path, { recursive: true, force: true })
```

### Timer

Dùng `setInterval(15000)` với `.unref()` -- không giữ process alive.

---

Xem thêm: [Spec](../specs/file-cleanup-daemon.spec.md) | [Plan](../plans/file-cleanup-daemon.plan.md)
