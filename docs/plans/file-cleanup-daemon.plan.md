# Plan: File Cleanup Daemon

## Các bước thực hiện

- [x] **Bước 1: Tạo SettingsCleaner class** (file: `src/plugin/cleaner.ts`, dòng 30-116)

    **Signature:**
    ```ts
    class SettingsCleaner {
      #timer: ReturnType<typeof setInterval> | null = null;
      #folders: string[] = [];
      watch(folder: string): this;
      ignore(folder: string, pid: string, id: string): Promise<void>;
      include(folder: string, pid: string, id: string): Promise<void>;
      stop(): Promise<void>;
      #toggleLock(shouldLock: boolean, folder: string, pid: string, id: string): Promise<void>;
      #cleanup(): Promise<void>;
    }
    ```

    **Constants (dòng 21-22):**
    ```ts
    const CLEANUP_INTERVAL = 15_000;  // 15s
    const LOCKABLE_ITEMS = (pid: string, id: string): string[] => [`t/${pid}`, `s/${id}.ini`, `s/${id}1.ini`];
    ```

    **Export:** `export default new SettingsCleaner()` — singleton.

    **Tại sao:** Singleton pattern cho toàn bộ plugin. Timer `.unref()` cho phép Node process exit không bị block.

- [x] **Bước 2: Implement watch()** (file: `src/plugin/cleaner.ts`, dòng 51-60)

    **Signature:**
    ```ts
    watch(folder: string): this
    ```

    **Logic:**
    ```ts
    watch(folder: string): this {
      if (!this.#folders.includes(folder)) this.#folders.push(folder);
      if (!this.#timer) {
        void this.#cleanup();  // cleanup ngay (không đợi 15s)
        this.#timer = setInterval(() => void this.#cleanup(), CLEANUP_INTERVAL).unref();
      }
      return this;
    }
    ```
    - `void` operator — chạy async cleanup nhưng không await.
    - `.unref()` — timer không giữ process alive.

    **Edge cases:**
    - Gọi `watch()` với cùng folder 2 lần → lần 2: `includes` true → skip push.
    - Timer đã chạy → skip setInterval, chỉ add folder.
    - `#cleanup()` lần đầu reject → `void` swallow error.

    **Tại sao:** Cleanup ngay lần đầu để dọn rác từ session trước. `.unref()` cho phép Node process exit sạch.

- [x] **Bước 3: Implement ignore() + include()** (file: `src/plugin/cleaner.ts`, dòng 37-46, 62-76)

    **Signatures:**
    ```ts
    async ignore(folder: string, pid: string, id: string): Promise<void>
    async include(folder: string, pid: string, id: string): Promise<void>
    ```

    **Logic #toggleLock:**
    ```ts
    async #toggleLock(shouldLock: boolean, folder: string, pid: string, id: string): Promise<void> {
      for (const item of LOCKABLE_ITEMS(pid, id)) {
        const itemPath = path.join(folder, item);
        try {
          await lock[shouldLock ? 'lock' : 'unlock'](itemPath, {
            onCompromised: () => debug(`File lock tại ${itemPath} không được cập nhật.`),
          });
        } catch (err) {
          const nodeErr = err as NodeJS.ErrnoException;
          if (nodeErr.code !== 'ENOENT') throw err;  // ENOENT = file chưa tồn tại → ignore
        }
      }
    }
    ```

    **LOCKABLE_ITEMS patterns:**
    ```
    t/{pid}     — process file (lock khi process chạy, unlock khi dừng)
    s/{id}.ini  — settings file
    s/{id}1.ini — extra settings file
    ```

    **Edge cases:**
    - File chưa được engine tạo ra → `lock()` fail ENOENT → catch → continue (không throw).
    - onCompromised: proper-lockfile không thể refresh lock (disk full) → log warning, không throw.
    - Gọi `ignore()` nhiều lần → lần 2: file đã lock → proper-lockfile lock lại (throw EEXIST hoặc lock mới tuỳ version).

    **Tại sao:** proper-lockfile tạo file `.lock` bên cạnh file gốc. ENOENT = file chưa tạo → ignore. Lock compromised hy hữu — chỉ log warning.

- [x] **Bước 4: Implement #cleanup()** (file: `src/plugin/cleaner.ts`, dòng 99-115)

    **Logic:**
    ```ts
    async #cleanup(): Promise<void> {
      for (const folder of this.#folders) {
        const pattern = path.join(folder, `{${['t', 's'].join(',')}}`, '*');
        const entries = await fg(pattern, { stats: true, onlyFiles: false });
        for (const { path: entryPath, stats } of entries) {
          if (!stats || Date.now() - stats.mtimeMs <= CLEANUP_INTERVAL) continue;
          // .txt trong s/ check lock dựa trên .ini tương ứng
          const parsedPath = path.parse(entryPath);
          const checkPath = parsedPath.ext === '.txt' && path.basename(parsedPath.dir) === 's'
            ? path.format({ ...parsedPath, base: undefined, ext: '.ini' })
            : entryPath;
          const isLocked = await lock.check(checkPath).catch(() => false);
          if (isLocked) continue;
          await rm(entryPath, { recursive: true, force: true });
        }
      }
    }
    ```

    **Edge cases:**
    - File mới tạo (mtime < 15s) → skip (có thể đang ghi).
    - File `.txt` trong `s/` → check lock dựa trên `.ini` tương ứng.
    - `lock.check` fail (file không tồn tại) → catch → `false` (không lock → cho xoá).
    - `rm` fail (permission) → throw → cleanup dừng.
    - Folder rỗng → fg trả về mảng rỗng → skip.

    **Tại sao:** `mtime > 15s` — file mới tạo có thể đang ghi. `.txt` trong `s/` là metadata — lock của `.ini` tương ứng bảo vệ cả 2.

- [x] **Bước 5: Implement stop()** (file: `src/plugin/cleaner.ts`, dòng 81-97)

    **Logic:**
    ```ts
    async stop(): Promise<void> {
      if (this.#timer) { clearInterval(this.#timer); this.#timer = null; }
      for (const folder of this.#folders) {
        const entries = await fg(path.join(folder, '{t,s}', '*'), { stats: true, onlyFiles: false });
        for (const { path: entryPath } of entries) {
          const isLocked = await lock.check(entryPath).catch(() => false);
          if (isLocked) await lock.unlock(entryPath).catch(() => {});
        }
      }
      this.#folders = [];
    }
    ```

    **Edge cases:**
    - Folder không còn file (đã cleanup hết) → fg trả về rỗng → skip.
    - `unlock()` fail (file đã bị xoá) → catch silently.
    - Stop gọi khi timer chưa start → `#timer` null → skip clear.
    - Gọi stop nhiều lần → lần 2: `#folders` rỗng → fg không chạy.

    **Tại sao:** Force unlock tất cả file trước khi stop — nếu process crash, file lock tồn đọng. Clear `#folders` đảm bảo stop chỉ chạy cleanup một lần.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

Test thủ công: launch browser, kiểm tra file lock (`t/{pid}`, `s/{id}.ini`), quit, kiểm tra file xoá.

## Ghi chú

- Singleton: chỉ một instance `SettingsCleaner` cho toàn bộ plugin.
- Timer `.unref()` — không block process exit.
- proper-lockfile trên Windows dùng file `.lock` bên cạnh file gốc.
- File pattern: `t/{pid}` (process), `s/{id}.ini` + `s/{id}1.ini` (settings).
- onCompromised handler log warning — file lock không cập nhật kịp.
