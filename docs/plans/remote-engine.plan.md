# Plan: RemoteEngine

- [x] Bước 1: Tạo EngineMeta interface, hằng số ARCH/CWD/DEFAULT_TIMEOUT
- [x] Bước 2: Implement resolvePackageRoot() -- walk up tìm package.json
- [x] Bước 3: Implement #updateMeta() -- parse project.xml + fetch/cache metadata
- [x] Bước 4: Implement helper functions: exists(), checksum(), download()
- [x] Bước 5: Implement #startProcessInternal() -- checksum, download, extract, config, spawn
- [x] Bước 6: Implement #startProcess() -- với Promise.race timeout
- [x] Bước 7: Implement runFunction() -- file-based IPC với chokidar

## Chi tiết kỹ thuật

- `resolvePackageRoot()` walk up từ `__dirname` tìm `package.json` có `name === 'fingerprint-chromium-engine'`
- `checksum()` dùng `createHash('sha1')` + `pipeline` (stream)
- `download()` dùng axios `responseType: 'stream'`
- PID cleanup: dùng `process.kill(pid, 0)` bắt lỗi `ESRCH`
