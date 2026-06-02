# Plan: Native Mutex

## Các bước thực hiện

- [x] **Bước 1: Tạo resolvePackageRoot() — walk-up tìm package root** (file: `src/plugin/mutex/index.ts`, dòng 16-34)

    **Signature:**
    ```ts
    function resolvePackageRoot(startDir: string): string
    ```

    **Logic chi tiết:**
    1. `let current = startDir` — bắt đầu từ thư mục chứa file mutex/index.ts.
    2. Loop:
       ```ts
       try {
         const pkg = requireNative(path.join(current, 'package.json'));
         if (pkg.name === 'fingerprint-chromium-engine') return current;
       } catch { /* continue */ }
       const parent = path.dirname(current);
       if (parent === current) throw new Error('[Mutex] Không tìm thấy thư mục gốc...');
       current = parent;
       ```
    3. Gọi `createRequire(import.meta.url)` để có require trong ESM.
    4. Kết quả lưu vào `PACKAGE_PATH` (module-level constant).

    **Edge cases:**
    - `__filename` là `dist/plugin/mutex/index.js` → __dirname = `dist/plugin/mutex` → walk up 3-4 levels.
    - package.json không có field `name` → require thành công nhưng không match → continue.
    - Walk đến `C:/` không tìm thấy → throw Error.

    **Tại sao:** Giống RemoteEngine — walk-up algorithm cần thiết sau tsup bundle vì `__dirname` thay đổi. Dùng `createRequire` cho ESM compatibility.

- [x] **Bước 2: Load native addon mutex.node** (file: `src/plugin/mutex/index.ts`, dòng 45-61)

    **Logic:**
    ```ts
    const mutex: MutexModule = (() => {
      try {
        const modulePath = path.join(PACKAGE_PATH, `plugin/mutex/${process.platform}-${process.arch}/mutex.node`);
        return requireNative(modulePath) as MutexModule;
      } catch (error: unknown) {
        const nodeErr = error as NodeJS.ErrnoException;
        const detail = nodeErr.message ? ` Chi tiết: ${nodeErr.message}` : '';
        if (process.platform === 'win32') {
          console.error(`[Mutex] Kiến trúc không được hỗ trợ: ${process.arch}${detail}`);
          throw new Error(`Unsupported OS architecture for named mutex.${detail}`);
        }
        console.error(`[Mutex] Nền tảng không được hỗ trợ: ${process.platform}${detail}`);
        throw new Error(`Unsupported OS platform for named mutex.${detail}`);
      }
    })();
    ```

    **Edge cases:**
    - `process.platform = 'win32'`, `process.arch = 'x64'` → path = `win32-x64/mutex.node` → OK.
    - `process.arch = 'ia32'` → path = `win32-ia32/mutex.node` → fallback cho 32-bit.
    - `process.platform = 'linux'` → throw "Unsupported OS platform" (dự án chỉ win32).
    - `PACKAGE_PATH` sai → file not found → catch → throw.
    - `mutex.node` corrupt → requireNative throw → catch → throw với architecture message.

    **Types (dòng 38-41):**
    ```ts
    interface MutexModule {
      create: (name: string) => void;
      [key: string]: unknown;
    }
    ```

    **Tại sao:** IIFE load ngay khi import — fail fast nếu native addon không tương thích. Error message rõ giúp user biết architecture issue.

- [x] **Bước 3: Export create() + release()** (file: `src/plugin/mutex/index.ts`, dòng 63-75)

    **Signatures:**
    ```ts
    export const create = mutex.create;
    export const release = (name: string): void => {
      if (typeof mutex.close === 'function') mutex.close(name);
    };
    ```

    **Logic:**
    - `create(name)`: gọi native `mutex.create(name)` — tạo Windows named mutex với tên `BASProcess${pid}`.
    - `release(name)`: kiểm tra native có `close()` không, nếu có thì gọi. Nếu không, skip — Windows kernel tự cleanup khi process exit.

    **Edge cases:**
    - Native addon không có `close()` → release là no-op.
    - `create()` gọi 2 lần cùng tên → mutex đã tồn tại → native trả về handle cũ (Windows behavior).
    - Process crash → mutex tự cleanup — không cần release.
    - Gọi `release()` với name chưa được create → native `close()` fail → throw.

    **Tại sao:** Windows kernel auto-cleanup named mutex khi process thoát — nếu process crash, mutex tự giải phóng. Native `close()` là optional optimization.

## Kiểm tra

```bash
npm run lint      # ESLint check
npm run build     # tsup build
```

## Ghi chú

- `resolvePackageRoot()` dùng `createRequire` — giống RemoteEngine.
- Bug fix: hardcoded path sai sau tsup bundle (KNOWN_ISSUES.md #6) — walk-up giải quyết.
- Windows kernel auto-cleanup mutex handle — không cần release.
- Platform-arch path: `plugin/mutex/${platform}-${arch}/mutex.node`.
