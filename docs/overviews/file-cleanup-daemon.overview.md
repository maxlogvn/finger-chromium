# Overview: File Cleanup Daemon

File: `src/plugin/cleaner.ts` (97 dòng), singleton `SettingsCleaner`.

## Lưu ý kỹ thuật

- `#cleanup()` dùng `fast-glob` với `stats: true` để lấy `mtimeMs`. Dùng `Date.now() - mtimeMs < 15000` để skip file mới tạo.
- `.txt → .ini` mapping: khi glob thấy `.txt`, kiểm tra lock trên `.ini` cùng prefix. Lý do: engine tạo `.ini` files, deploy tool tạo `.txt` files -- cả 2 cần được bảo vệ bởi cùng lock.
- `proper-lockfile` lock file thực chất là tạo file `.lock` bên cạnh file gốc, dùng `fs.open` với flag `O_EXCL`. Cross-platform.
- `onCompromised` handler log warning nếu lock bị compromised -- không throw để không crash cleanup.
