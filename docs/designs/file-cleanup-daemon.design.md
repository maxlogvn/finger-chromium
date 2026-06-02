# Design: File Cleanup Daemon

## Vấn đề

Thư mục làm việc của engine (`data/t/`, `data/s/`) tích tụ file rác sau nhiều lần chạy (temp files, orphaned request/response files). Cần dọn dẹp tự động mà không xoá file đang được process sở hữu.

## Giải pháp: SettingsCleaner singleton

### 3 thao tác chính

1. **watch(folder)**: Đăng ký thư mục cần dọn, khởi động timer 15s nếu chưa có.
2. **ignore(folder, pid, id)**: Lock 3 file `t/${pid}`, `s/${id}.ini`, `s/${id}1.ini` -- không cho cleaner xoá.
3. **include(folder, pid, id)**: Unlock -- cho phép cleaner xoá khi process kết thúc.

### Cleanup cycle (mỗi 15s)

```
#cleanup():
  1. Glob {t,s}/* trong mỗi watched folder
  2. Filter: bỏ qua file modified < 15s (có thể đang được ghi)
  3. Với file .txt trong thư mục s/: kiểm tra lock trên file .ini cùng prefix
  4. Với file khác: kiểm tra lock trực tiếp
  5. Nếu không locked -> rm(path, { recursive: true, force: true })
```

### Lock mechanism

Dùng `proper-lockfile` -- tạo file `.lock` bên cạnh file gốc, dùng `fs.open` với flag `O_EXCL`. Cross-platform.

`onCompromised` callback log warning, không throw -- lock compromised không crash cleanup.

### Timer

`setInterval(15000)` với `.unref()` -- không giữ process alive. Process có thể exit ngay cả khi timer còn chạy.

---

Xem thêm: [Spec](../specs/file-cleanup-daemon.spec.md) | [Plan](../plans/file-cleanup-daemon.plan.md)
