# Plan: Quản lý Profile

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa ProfileOptions** (file: `src/types/profile.ts`, dòng 16-30)

    **Signature:**
    ```ts
    export interface ProfileOptions {
      loadProxy?: boolean;       // @default true
      loadFingerprint?: boolean; // @default true
    }
    ```

    **Tại sao:** Khi profile đã có proxy/fingerprint từ session trước, engine có thể load lại — không cần gọi useProxy/useFingerprint lại.

- [x] **Bước 2: Implement AdapterDataManager** (file: `src/adapter/playwright/data.ts`, dòng 28-97)

    **Signature:**
    ```ts
    export class AdapterDataManager {
      private readonly tempRootDir: string;
      private readonly instanceTempDir: string;
      constructor(options?: AdaDataManagerOptions);
      map(sourceProfileDir: string): string;           // source → temp
      map(tempProfileDir: string, destinationDir: string): string;  // temp → dest
      unmap(tempDirPath: string): void;
      dispose(): void;
      private generateUniqueName(): string;
    }
    ```

    **Logic chi tiết constructor:**
    ```ts
    constructor(options: AdaDataManagerOptions = {}) {
      this.tempRootDir = options.tempRootDir ?? path.join(BROWSER_RUNNING_DIR, 'profile');
      this.instanceTempDir = path.join(this.tempRootDir, this.generateUniqueName());
    }
    ```

    **generateUniqueName:**
    ```ts
    private generateUniqueName(): string {
      const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
      return `${Date.now()}_${hex}`;  // vd: "1717430400000_a3f1"
    }
    ```

    **map() logic (overload):**
    ```ts
    map(inputDir: string, targetDir?: string): string {
      const dest = targetDir ?? this.instanceTempDir;
      const srcResolved = path.resolve(inputDir);
      const destResolved = path.resolve(dest);
      this.ensureDir(srcResolved);  // kiểm tra source tồn tại
      this.ensureDir(path.dirname(destResolved));  // tạo parent dir
      try { fs.cpSync(srcResolved, destResolved, { recursive: true, force: true }); }
      catch (error) { throw new Error(`[DataManager] Sao chép thất bại...`); }
      return destResolved;
    }
    ```

    **unmap():**
    ```ts
    unmap(tempDirPath: string): void {
      const resolvedPath = path.resolve(tempDirPath);
      if (!fs.existsSync(resolvedPath)) { console.warn(`[DataManager] Bỏ qua xoá...`); return; }
      try { fs.rmSync(resolvedPath, { recursive: true, force: true }); }
      catch (error) { throw new Error(`[DataManager] Dọn dẹp thất bại...`); }
    }
    ```

    **Edge cases:**
    - Source profile không tồn tại → `ensureDir` không throw (mkdirSync recursive) → `cpSync` source không tồn tại → throw Error.
    - Temp dir đã tồn tại (name conflict) → `cpSync` force: true → overwrite.
    - `rmSync` fail (permission) → throw Error.

    **Tại sao:** Temp dir tránh corrupt profile gốc khi browser chạy. `cpSync`/`rmSync` đồng bộ tránh race condition. Timestamp + hex tránh conflict.

- [x] **Bước 3: Tích hợp useProfile() vào BrowserEngine** (file: `src/adapter/playwright/chromium.ts`, dòng 122-126, 134-153, 191-212)

    **Flow:**
    ```ts
    // useProfile() — gọi ngay khi config
    useProfile(dirPath: string, options?: ProfileOptions): this {
      this.saveProfileDirPath = dirPath;
      this.profileData = [this.dataManager.map(dirPath), options];  // copy vào temp
      return this;
    }

    // launch() — relay xuống plugin
    this.engine.useProfile(...this.profileData);

    // quit() — lưu từ temp về đích
    const targetSavePath = saveDataPath ?? this.saveProfileDirPath;
    if (targetSavePath) this.dataManager.map(this.profileData[0], targetSavePath);
    this.dataManager.unmap(BROWSER_RUNNING_DIR);
    ```

    **Edge cases:**
    - `saveDataPath ≠ saveProfileDirPath` → lưu vào path khác (snapshot).
    - Không gọi `useProfile()` → `profileData` default temp.
    - `quit()` gọi khi context undefined → skip save.

- [x] **Bước 4: Tích hợp useProfile() vào FingerprintPlugin** (file: `src/plugin/index.ts`, dòng 113-117, 239-249)

    **Flow:**
    ```ts
    useProfile(value = '', options: ProfileOptions = {}): this {
      validateConfig('profile', value, options);
      this.profile = { value, options };
      return this;
    }

    // _launch() — gửi lên engine
    api('setup', { profile: this.profile ?? { value: getProfilePath(options), options: { loadProxy: true, loadFingerprint: true } }, ... });
    ```

    **Fallback profile:**
    ```ts
    this.profile ?? {
      value: getProfilePath(options),  // từ --user-data-dir
      options: { loadProxy: true, loadFingerprint: true }
    }
    ```

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- `cpSync`/`rmSync` đồng bộ — tránh race condition multi-instance.
- Temp dir tạo một lần khi AdapterDataManager khởi tạo.
- `map()` overload: 1 param (source→temp), 2 params (temp→dest).
- `saveDataPath` trong quit() ghi đè save path — snapshot.
