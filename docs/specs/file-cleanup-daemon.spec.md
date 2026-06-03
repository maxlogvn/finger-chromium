# Spec: File Cleanup Daemon

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Daemon tự động dọn dẹp file tạm do engine tạo ra — file `.ini`, process tracking files trong thư mục `t/` và `s/`. Chạy timer 15 giây quét thư mục engine, kiểm tra file nào còn được lock (proper-lockfile), và chỉ xoá file không còn lock và đã hết hạn (mtime > 15 giây).

Mục đích: engine tạo nhiều file tạm trong quá trình hoạt động (settings.ini, process tracking). Nếu không dọn, thư mục engine phình to theo thời gian — đặc biệt khi chạy nhiều session.

Source: `src/plugin/cleaner.ts` (105 dòng).

## Yêu cầu

- Timer cleanup chạy mỗi 15 giây, `.unref()` — không block Node.js process exit.
- `watch(folder)` — đăng ký thư mục cần dọn dẹp, khởi động timer nếu chưa có.
- `ignore(folder, pid, id)` — lock 3 file: `t/{pid}`, `s/{id}.ini`, `s/{id}1.ini`.
- `include(folder, pid, id)` — unlock 3 file tương ứng.
- `stop()` — clear timer, unlock toàn bộ file còn locked, clear danh sách folder.
- Chỉ xoá file có mtime cũ hơn 15 giây — tránh xoá file vừa được tạo bởi process đang chạy.
- File lock compromised thì debug log, không throw.
- ENOENT khi lock/unlock → catch, ignore.
- Debug logging: `browser-with-fingerprints:cleaner`.

## Thiết kế

### Lock/Unlock flow

```
Plugin._launch():
  cleaner.watch(enginePwd)     ─── đăng ký folder, start timer
  cleaner.ignore(pwd, pid, id) ─── lock: t/{pid}, s/{id}.ini, s/{id}1.ini

Plugin.configure():
  cleaner.include(pwd, pid, id) ─── unlock → cho phép xoá khi process kết thúc

Plugin.cleanup():
  cleaner.stop()               ─── clear timer, unlock all, clear folders
```

### Cleanup logic (mỗi 15s)

```
#cleanup()
  │
  ├─ Với mỗi folder trong #folders:
  │    ├─ fast-glob scan {t,s}/*
  │    │
  │    └─ Với mỗi file:
  │         ├─ Skip nếu mtime <= 15s (file mới tạo)
  │         ├─ .txt trong s/ → check lock với file .ini tương ứng
  │         ├─ proper-lockfile check → skip nếu locked
  │         └─ rm(file) nếu không lock
```

Tại sao `.txt` trong `s/` check lock với file `.ini`? Vì engine tạo file `.txt` nhưng proper-lockfile lock trên file `.ini`. Cleaner tự động mapping: thay `.txt` bằng `.ini` trong lock check.

### stop() cleanup

```
stop()
  ├─ clearInterval(#timer)
  ├─ Với mỗi folder:
  │    ├─ fast-glob scan {t,s}/*
  │    └─ Với mỗi file: unlock nếu còn locked
  └─ Clear #folders
```

Tham chiếu design doc: `docs/designs/file-cleanup-daemon.design.md`.

## API / Data flow

```ts
import cleaner from '../../plugin/cleaner';

// Đăng ký folder + start timer
cleaner.watch('./engine/pwd');

// Lock file khi engine setup
await cleaner.ignore('./engine/pwd', '12345', 'abc-123');

// Unlock khi configure xong
await cleaner.include('./engine/pwd', '12345', 'abc-123');

// Dừng cleanup
await cleaner.stop();
```

### Lock patterns

| Pattern | Ví dụ | Mô tả |
|---|---|---|
| `t/{pid}` | `t/12345` | Process tracking file |
| `s/{id}.ini` | `s/abc-123.ini` | Settings file |
| `s/{id}1.ini` | `s/abc-1231.ini` | Settings file phụ |

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/cleaner.ts` | `SettingsCleaner` class + singleton export | 105 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| File không tồn tại khi lock/unlock (ENOENT) | Catch, ignore — file có thể chưa được tạo hoặc đã bị xoá |
| Lock compromised (proper-lockfile callback) | `debug` log, không throw |
| `rm` thất bại (file đã bị xoá bởi process khác) | Không throw — `rm` với `force: true` |
| `stop()` gọi khi chưa start | Không lỗi — #folders rỗng, #timer null |

## Kiểm tra

- Happy path: `watch()` → `ignore()` → timer quét → file không bị xoá → `include()` → timer quét → file bị xoá.
- Edge case: file mới tạo (mtime <= 15s) → không xoá.
- Edge case: file `.txt` trong `s/` — check lock với `.ini` tương ứng.
- Error: lock compromised → debug log, cleanup vẫn chạy.
- Stop: `stop()` clear timer + unlock all files còn locked.
- Timer `.unref()`: process exit không bị block bởi timer.
