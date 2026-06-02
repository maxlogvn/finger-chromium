# Plan: File Cleanup Daemon

- [x] Bước 1: Tạo SettingsCleaner class với private fields (#timer, #folders)
- [x] Bước 2: Implement watch() -- đăng ký folder, start timer
- [x] Bước 3: Implement #toggleLock() -- proper-lockfile.lock/unlock
- [x] Bước 4: Implement ignore() + include() -- public wrappers
- [x] Bước 5: Implement #cleanup() -- glob + check lock + rm
- [x] Bước 6: Tích hợp vào FingerprintPlugin._launch()
