# Spec: File Cleanup Daemon

## File: `src/plugin/cleaner.ts` (97 dòng)

### Hằng số

| Tên | Giá trị | Mô tả |
|---|---|---|
| `CLEANUP_INTERVAL` | `15_000` | 15 giây giữa các lần cleanup |
| `LOCKABLE_ITEMS(pid, id)` | `['t/${pid}', 's/${id}.ini', 's/${id}1.ini']` | 3 paths cần lock/unlock |

### Class `SettingsCleaner`

```ts
class SettingsCleaner {
  #timer: ReturnType<typeof setInterval> | null = null;
  #folders: string[] = [];

  watch(folder: string): this;
  ignore(folder: string, pid: string, id: string): Promise<void>;
  include(folder: string, pid: string, id: string): Promise<void>;
}
```

### Public Methods

| Method | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `watch(folder)` | `string` | `this` | Đăng ký folder cleanup, start timer 15s nếu chưa chạy |
| `ignore(folder, pid, id)` | `string, string, string` | `Promise<void>` | Lock 3 paths của process |
| `include(folder, pid, id)` | `string, string, string` | `Promise<void>` | Unlock 3 paths của process |

### Private Methods

#### `#toggleLock(shouldLock, folder, pid, id)`

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `for (const item of LOCKABLE_ITEMS(pid, id))` | Duyệt 3 paths |
| 2 | `itemPath = path.join(folder, item)` | Tạo full path |
| 3 | `await lock[shouldLock ? 'lock' : 'unlock'](itemPath, { onCompromised })` | Lock/unlock |
| 4 | `catch (err) if (code !== 'ENOENT') throw` | Bỏ qua ENOENT (file chưa tồn tại) |

#### `#cleanup()`

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `for (const folder of this.#folders)` | Duyệt watched folders |
| 2 | `pattern = path.join(folder, '{t,s}', '*')` | Glob pattern |
| 3 | `entries = await fg(pattern, { stats: true, onlyFiles: false })` | Quét entries |
| 4 | `if (!stats || Date.now() - stats.mtimeMs <= CLEANUP_INTERVAL) continue` | Skip file mới |
| 5 | `.txt -> .ini mapping` | Nếu là .txt trong s/, check lock trên .ini cùng prefix |
| 6 | `isLocked = await lock.check(checkPath).catch(() => false)` | Kiểm tra lock |
| 7 | `if (isLocked) continue` | Skip nếu locked |
| 8 | `await rm(entryPath, { recursive: true, force: true })` | Xoá |

### Lock Mapping

| File gốc | Lock kiểm tra trên |
|---|---|
| `t/<pid>` | `t/<pid>` (trực tiếp) |
| `s/<id>.txt` | `s/<id>.ini` (cùng prefix, đuôi .ini) |
| `s/<id>.ini` | `s/<id>.ini` (trực tiếp) |
| `s/<id>1.ini` | `s/<id>1.ini` (trực tiếp) |
| Các file khác | Trực tiếp trên file đó |

### posix path

Cleaner dùng `import { posix as path } from 'path'` -- luôn forward slash, cần thiết cho `fast-glob` hoạt động cross-platform.

### Integration trong `_launch()`

```ts
// Sau api('setup') thành công
await cleaner.watch(pwd).ignore(pwd, pid, id);
// Khi process kết thúc, gọi include()
```

---

## Kiểm tra

- File tạo trong 15s gần nhất không bị xoá.
- File locked không bị xoá.
- `.txt` mapping check lock trên `.ini`.
- onCompromised không crash cleanup.
- Timer unref không chặn process exit.

---
