# Product: File Cleanup Daemon

## Tổng quan

Daemon tự động dọn file rác trong thư mục làm việc của engine. Chạy ngầm với timer 15s, không ảnh hưởng performance. An toàn -- không bao giờ xoá file đang dùng.

## Cách hoạt động

### Khi browser chạy

```
_launch() -> cleaner.watch(pwd)               <- đăng ký folder
        -> cleaner.ignore(pwd, pid, id)       <- lock file của process
```

### Khi browser đóng

```
quit/close -> cleaner.include(pwd, pid, id)   <- unlock
```

### Cleanup cycle (mỗi 15s)

```
1. Quét {t,s}/* trong watched folders
2. Bỏ qua file modified < 15s (vừa tạo/đang ghi)
3. Kiểm tra lock
4. File không locked -> rm -rf
```

## File lock mapping

| File pattern | Lock kiểm tra trên |
|---|---|
| `t/<pid>` | `t/<pid>` |
| `s/<id>.ini` | `s/<id>.ini` |
| `s/<id>1.ini` | `s/<id>1.ini` |
| `s/<id>.txt` | `s/<id>.ini` (cùng prefix) |

## An toàn

- **proper-lockfile**: lock file bằng `O_EXCL`, cross-platform.
- **ENOENT handling**: nếu file đã bị xoá trước đó, skip silently.
- **Timer unref**: không chặn process exit.
- **onCompromised**: lock compromised -> chỉ log warning, không crash.

---
