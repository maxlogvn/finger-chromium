# Spec: File Cleanup Daemon

## Module: src/plugin/cleaner.ts (97 dòng)

### Class SettingsCleaner

```ts
class SettingsCleaner {
  #timer: NodeJS.Timeout | null;
  #folders: Set<string>;

  watch(folder: string): this;
  ignore(folder: string, pid: string, id: string): Promise<void>;
  include(folder: string, pid: string, id: string): Promise<void>;
}
```

### Public methods

| Method | Mô tả |
|---|---|
| `watch(folder)` | Đăng ký folder để cleanup. Start timer 15s nếu chưa chạy |
| `ignore(folder, pid, id)` | Lock file `t/${pid}`, `s/${id}.ini`, `s/${id}1.ini` |
| `include(folder, pid, id)` | Unlock các files trên |

### Private methods

```ts
#toggleLock(shouldLock: boolean, folder: string, pid: string, id: string): Promise<void>
```

Lock hoặc unlock các paths:
```
${folder}/t/${pid}
${folder}/s/${id}.ini
${folder}/s/${id}1.ini
```

Bắt `ENOENT` silent -- nếu file chưa tồn tại, không throw.

### Lock mapping

`.txt → .ini`: Khi gặp file `s/*.txt` trong cleanup, kiểm tra lock trên `s/*.ini` (cùng prefix). Vì engine tạo `.ini` lock files.

### Cleanup interval

```ts
this.#timer = setInterval(() => this.#cleanup(), 15000).unref();
```

`.unref()`: timer không ngăn process exit.
