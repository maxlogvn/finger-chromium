# Overview: File Cleanup Daemon

## Tóm tắt

Đã triển khai `SettingsCleaner` -- daemon dọn dẹp file tạm của engine với timer interval 15s. Dùng `proper-lockfile` để lock/unlock file theo PID, `fast-glob` để quét file patterns. Singleton, export default.

## Kiến trúc

```
SettingsCleaner
  |-- this.watchPaths: string[]     danh sách thư mục quét
  |-- this.include: string[]        file patterns (.txt, .ini)
  |-- this.ignore: number[]         PID cần ignore (đang dùng)
  |-- this.timer: NodeJS.Timer|null interval 15s
  |
  |-- watch(dir, include, ignore)   cấu hình paths + patterns
  |-- stop()                        clear timer + unlock all
  |-- #cleanup()                    quét và xoá file
  |     |-- fast-glob theo patterns
  |     |-- lọc file theo PID (t/{pid}, s/{id}.ini)
  |     |-- proper-lockfile.check() -- kiểm tra lock
  |     |-- fs.unlink() nếu unlocked
  |     |-- catch ENOENT (file đã bị xoá)
  |
  |-- #toggleLock(file, action)     lock/unlock file
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| Class declaration | `src/plugin/cleaner.ts` | 20-40 |
| Constructor + fields | `src/plugin/cleaner.ts` | 42-65 |
| `watch()` | `src/plugin/cleaner.ts` | 67-85 |
| `stop()` | `src/plugin/cleaner.ts` | 87-110 |
| `#cleanup()` | `src/plugin/cleaner.ts` | 112-180 |
| `#toggleLock()` | `src/plugin/cleaner.ts` | 182-210 |
| Export singleton | `src/plugin/cleaner.ts` | 212 |

## Flow cleanup chi tiết

```
#cleanup()
  1. fast-glob quét tất cả file trong watchPaths matching include patterns
  2. Với mỗi file:
     - parse PID từ tên file: t/{pid}.txt -> pid, s/{id}.ini -> skip (lock riêng)
     - nếu PID trong this.ignore -> skip
     - proper-lockfile.check(filePath) -> còn lock? -> skip
     - fs.unlink(filePath) -> xoá
     - catch ENOENT -> file đã bị xoá bởi process khác -> skip
  3. Cập nhật lock: lock file mới, unlock file đã xoá
```

## File patterns

| Pattern | Ý nghĩa | Ví dụ |
|---|---|---|
| `t/{pid}.txt` | Request file -- PID = engine process ID | `t/1234.txt` |
| `s/{id}.ini` | Config file -- ID random | `s/a3f1.ini` |
| `s/{id}.txt` | Lock file tương ứng với .ini | `s/a3f1.txt` |

## Quyết định thiết kế

- **Timer 15s**: Cân bằng giữa performance và real-time cleanup. 15s là đủ nhanh để không tích tụ file, đủ chậm để không ảnh hưởng CPU.
- **`proper-lockfile`**: File-based lock system. Kiểm tra `lockfile.check()` trước khi xoá -- tránh xoá file đang được engine ghi.
- **Ignore theo PID**: File của process đang chạy (PID trong `this.ignore`) sẽ không bị xoá. `stop()` unlock toàn bộ.
- **ENOENT catch**: Race condition -- file có thể bị xoá giữa lúc `glob` và `unlink`. Catch và skip, không throw.
- **Singleton**: Một `SettingsCleaner` cho toàn bộ ứng dụng -- tránh multiple timers.

## Edge cases

- Timer đang chạy, gọi `watch()` lại -> set interval mới, clear interval cũ.
- `proper-lockfile.check()` throw (file không tồn tại) -> catch -> skip.
- File `.txt` trong `s/` dùng lock của file `.ini` tương ứng -- lock một file lock cả cặp.
- `stop()` gọi khi chưa `watch()` -> `this.timer` null -> skip.

## Lưu ý

- Singleton: `export default new SettingsCleaner()` -- một instance toàn cục.
- File `.txt` trong `s/` dùng lock của file `.ini` tương ứng.
- `#toggleLock()` dùng `lockfile.lock()` và `lockfile.unlock()`.

## Tài liệu liên quan

- `docs/designs/file-cleanup-daemon.design.md`
- `docs/specs/file-cleanup-daemon.spec.md`
- `docs/plans/file-cleanup-daemon.plan.md`
- `docs/products/file-cleanup-daemon.product.md`
- `src/plugin/cleaner.ts`
