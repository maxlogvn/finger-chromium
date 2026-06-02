# Plan: Playwright Module Loader

## Các bước thực hiện

- [x] **Bước 1: Định nghĩa LoaderResult type** (file: `src/types/loader.ts`, dòng 1-10)

    **Signature:**
    ```ts
    export interface LoaderResult {
      version: string;      // playwright-core version
      package: string;      // package name
      executablePath: string; // chromium executable path
      injectPlaywright: boolean; // inject flag
    }
    ```

- [x] **Bước 2: Implement Loader class** (file: `src/loader/index.ts`, dòng 15-80)

    **Signature:**
    ```ts
    export class Loader {
      private constructor();
      static create(): Loader;
      static getPlaywrightModuleDir(): string;
      load(options?: { fallbackPackages?: string[]; minVersion?: string }): LoaderResult;
      getCoreVersion(packagePath: string): string;
      validateVersion(versionGetter: () => string): boolean;
      private extractVersion(packagePath: string): string;
      private getChromiumExecutablePath(packagePath: string): string;
      private resolvePackage(packages: string[]): string;
    }
    ```

    **Chi tiết từng method:**

    **`resolvePackage(packages: string[])` logic:**
    ```ts
    private resolvePackage(packages: string[]): string {
      for (const pkg of packages) {
        const pkgPath = this.getPlaywrightModuleDir(pkg);
        if (pkgPath) return pkgPath;  // require.resolve thành công
      }
      throw new InvalidEngineError('Không tìm thấy playwright-core.');
    }
    ```

    **`getPlaywrightModuleDir()` logic (walk-up algorithm):**
    ```ts
    static getPlaywrightModuleDir(packageName: string = 'playwright-core'): string {
      let dir = __dirname;
      for (let i = 0; i < 10; i++) {  // max 10 levels up
        const pkgPath = path.join(dir, 'node_modules', packageName);
        if (fs.existsSync(pkgPath)) return pkgPath;
        dir = path.dirname(dir);
      }
      return this.playwrightModuleDir;  // fallback — cached
    }
    ```

    **`getCoreVersion(packagePath: string)` logic:**
    ```ts
    getCoreVersion(packagePath: string): string {
      const pkgJson = path.join(packagePath, 'package.json');
      const json = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
      return json.version;
    }
    ```

    **`validateVersion(versionGetter: () => string)` logic:**
    ```ts
    validateVersion(versionGetter: () => string): boolean {
      const minVersion = '1.27.1';
      const version = versionGetter();
      return compareVersions(version, minVersion) >= 0;
    }
    ```

    **`getChromiumExecutablePath(packagePath: string)` logic:**
    ```ts
    // Dùng createRequire để import playwright-core từ path cụ thể
    private getChromiumExecutablePath(packagePath: string): string {
      const localRequire = createRequire(path.join(packagePath, 'package.json'));
      const pw = localRequire(packagePath);
      return pw.chromium.executablePath();
    }
    ```

    **Tại sao createRequire:**
    - `require` không dùng được khi bundle ESM (tsup).
    - `createRequire` tạo `require` function từ file path cụ thể.
    - Không dùng `await import()` vì playwright-core CJS module.

    **`load()` logic:**
    ```ts
    load(options?: { fallbackPackages?: string[]; minVersion?: string }): LoaderResult {
      const fallbackPackages = options?.fallbackPackages ?? ['playwright-core'];
      const minVersion = options?.minVersion ?? '1.27.1';

      // 1. Resolve package path
      const packagePath = this.resolvePackage(fallbackPackages);

      // 2. Validate version
      const version = this.getCoreVersion(packagePath);
      if (compareVersions(version, minVersion) < 0) {
        throw new Error(`Version ${version} < ${minVersion}`);
      }

      // 3. Get executable path
      const executablePath = this.getChromiumExecutablePath(packagePath);

      return { version, package: path.basename(packagePath), executablePath, injectPlaywright: false };
    }
    ```

    **Edge cases:**
    - `packagePath = false` (require.resolve fail) → throw InvalidEngineError.
    - `JSON.parse(package.json)` fail → throw SyntaxError.
    - `compareVersions('1.27.0', '1.27.1')` → -1 → throw version too old.
    - `pw.chromium.executablePath()` fail → throw.
    - walk-up không tìm thấy sau 10 level → dùng fallback `playwrightModuleDir`.

- [x] **Bước 3: Playwright loader adapter** (file: `src/adapter/playwright/loader.ts`, dòng 1-57)

    **Signature:**
    ```ts
    export class PlaywrightLoader {
      static load(): LoaderResult;
    }
    ```

    **Logic khác biệt:**
    - Dùng `Loader.create().load({ fallbackPackages: ['playwright-core'] })`.
    - Target version `>= 1.27.1`.
    - Caching: `PlaywrightLoader.cachedResult` — Singleton pattern.

    **Tại sao:** Adapter pattern — Playwright-specific config, tách khỏi Loader generic.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- `createRequire` import CJS playwright-core từ ESM bundle.
- Walk-up algorithm up 10 levels — dùng cho bundled + non-bundled.
- Min version `1.27.1` — Chromium 107+ CDP support.
- `fallbackPackages` default `['playwright-core']`.
