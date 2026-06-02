# Plan: File Cleanup Daemon

## Các bước thực hiện

- [x] **Bước 1: Tạo `src/plugin/cleaner.ts`**
  - Class `SettingsCleaner` với private fields `#timer`, `#folders`.
  - Singleton export default.

- [x] **Bước 2: Implement `watch(folder)`**
  - Đăng ký folder vào `#folders` (nếu chưa có).
  - Start `setInterval(15000)` với `.unref()` nếu chưa chạy.
  - Gọi `#cleanup()` ngay lần đầu.

- [x] **Bước 3: Implement `#toggleLock()`**
  - Dùng `proper-lockfile.lock`/`unlock` cho 3 paths từ `LOCKABLE_ITEMS`.
  - Bắt `ENOENT` silent.

- [x] **Bước 4: Implement `ignore()` + `include()`**
  - Wrapper public gọi `#toggleLock(true/false)`.

- [x] **Bước 5: Implement `#cleanup()`**
  - Glob `{t,s}/*` trong mỗi watched folder.
  - Skip file modified < 15s.
  - `.txt -> .ini` mapping cho file trong s/.
  - Check lock, rm nếu không locked.

- [x] **Bước 6: Tích hợp vào `FingerprintPlugin._launch()`**
  - Gọi `cleaner.watch(pwd).ignore(pwd, pid, id)` sau `api('setup')`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/cleaner.ts` | SettingsCleaner class (97 dòng) |
| `src/plugin/index.ts` | `_launch()` gọi cleaner |

## Kiểm tra

- `npm run lint` -- 0 errors.

---
