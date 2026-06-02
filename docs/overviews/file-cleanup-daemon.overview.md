# Overview: File Cleanup Daemon

## Mục tiêu

Tạo daemon dọn file rác trong thư mục engine, dùng proper-lockfile để tránh xoá file đang dùng.

## Kết quả

- `src/plugin/cleaner.ts`: 97 dòng, class `SettingsCleaner` singleton.
- `watch()`, `ignore()`, `include()` -- 3 public methods.
- Timer 15s cleanup interval, `.unref()`.

## Kiểm tra

- `npm run lint` -- 0 errors.

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### .txt -> .ini mapping

Trong `#cleanup()`, file `.txt` trong thư mục `s/` kiểm tra lock trên file `.ini` cùng tên:

```ts
parsedPath.ext === '.txt' && path.basename(parsedPath.dir) === 's'
```

Lý do: engine tạo `.ini` lock files, deploy tool tạo `.txt` files. Cả 2 cần bảo vệ bởi cùng lock. Nếu có file `.txt` không đi kèm `.ini`, lock check trên path `.ini` fail (ENOENT), `lock.check().catch(() => false)` trả về `false` (không locked) -> file bị xoá dù có thể đang dùng.

### posix path

```ts
import { posix as path } from 'path';
```

Luôn dùng forward slash, kể cả trên Windows. `fast-glob` yêu cầu forward slash để hoạt động cross-platform.

### LOCKABLE_ITEMS = 3 paths

`['t/${pid}', 's/${id}.ini', 's/${id}1.ini']` -- cả 3 phải lock/unlock đồng thời. Nếu chỉ lock 1 trong 3, cleaner có thể xoá 2 file còn lại.

### Điều kiện skip mtimeMs

`Date.now() - stats.mtimeMs <= CLEANUP_INTERVAL` (15000ms) -- file được sửa trong 15 giây gần nhất bị skip. Ngăn xoá file đang được ghi, nhưng có thể giữ lại file rác nếu engine crash và mtime còn trong window.

### onCompromised

```ts
onCompromised: () => {
  debug(`File lock tại đường dẫn ${itemPath} không được cập nhật.`);
}
```

Lock compromised khi file `.lock` bị xoá tay hoặc process chiếm lock chết bất thường. Chỉ log warning, không throw.

### Glob pattern

`path.join(folder, '{t,s}', '*')` -- quét cả file và thư mục (`onlyFiles: false`). Thư mục con được xoá bằng `rm(entryPath, { recursive: true })`.

---
