# Plan: Hạ tầng Dự án (Project Infrastructure)

## Các bước thực hiện

- [x] **Bước 1: Khởi tạo package.json** (file: `package.json`, dòng 1-42)

    **Scripts:**
    ```json
    {
      "scripts": {
        "lint": "eslint src/ tests/ --fix",
        "test": "mocha",
        "build": "tsup",
        "prepare": "npm run build",
        "clean": "tsup --clean",
        "dev": "npm run build -- --watch"
      },
      "type": "module",             // ESM mặc định
      "files": ["dist", "!"],       // npm publish chỉ dist
      "main": "./dist/index.cjs",   // CJS entry
      "module": "./dist/index.js",  // ESM entry
      "exports": {
        ".": {
          "import": "./dist/index.js",
          "require": "./dist/index.cjs"
        }
      }
    }
    ```

    **Chú thích scripts:**
    | Script | Lệnh | Mục đích |
    |---|---|---|
    | `lint` | `eslint src/ tests/ --fix` | Lint toàn bộ source + test |
    | `test` | `mocha` | Chạy test (mocha config trong `.mocharc.yml`) |
    | `build` | `tsup` | Bundle (tsup.config.ts) |
    | `prepare` | `npm run build` | Auto-build khi npm install từ GitHub |
    | `clean` | `tsup --clean` | Xoá dist/ tương thích Windows |
    | `dev` | `npm run build -- --watch` | Watch mode khi dev |

    **Tại sao:** `prepare` script tự động chạy khi `npm install` từ GitHub — không cần user build thủ công. `clean` dùng `tsup --clean` thay `rm -rf` (Windows compatible).

- [x] **Bước 2: Cấu hình tsup** (file: `tsup.config.ts`, dòng 1-24)

    **Config:**
    ```ts
    import { defineConfig } from 'tsup';
    export default defineConfig({
      entry: ['src/index.ts'],
      clean: true,
      dts: true,        // .d.ts + .d.ts.map
      format: ['esm', 'cjs'],
      platform: 'node',
      target: 'node18',
      tsconfig: './tsconfig.json',
      bundle: true,
    });
    ```

    **Tại sao:** `bundle: true` — bundle tất cả dependency (trừ peer) vào 1 file. `dts: true` — tự động type.

- [x] **Bước 3: Cấu hình TypeScript** (file: `tsconfig.json`, dòng 1-22)

    ```json
    {
      "compilerOptions": {
        "strict": true,
        "target": "ES2022",
        "module": "ES2022",
        "moduleResolution": "bundler",
        "outDir": "dist",
        "rootDir": "src",
        "skipLibCheck": true
      },
      "include": ["src/**/*"],
      "exclude": ["nede_modules", "dist"]
    }
    ```

- [x] **Bước 4: Cấu hình ESLint** (file: `eslint.config.mjs`, dòng 1-34)

    **Config:**
    ```ts
    import tseslint from 'typescript-eslint';
    export default tseslint.config(
      { ignores: ['dist/**', 'nede_modules/**'] },
      ...tseslint.configs.strict,
      { rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
      }},
    );
    ```

- [x] **Bước 5: Cấu hình Prettier** (file: `.prettierrc`, dòng 1-7)

    ```yaml
    {
      "semi": true,
      "singleQuote": true,
      "tabWidth": 2,
      "useTabs": true,
      "trailingComma": "all",
      "printWidth": 100
    }
    ```

- [x] **Bước 6: Cấu hình Mocha** (file: `.mocharc.yml`, dòng 1-5)

    **Config:**
    ```yaml
    spec: tests/**/*.test.ts
    timeout: 30000
    loader: tsx/esm
    ```

- [x] **Bước 7: Cấu hình .gitignore** (file: `.gitignore`, dòng 1-4)

    ```
    node_modules/
    dist/
    .env
    ```

## Kiểm tra

```bash
npm run lint      # ESLint
npm test          # Mocha
npm run build     # tsup bundle
```

## Ghi chú

- Output: ESM (`dist/index.js`) + CJS (`dist/index.cjs`).
- `bundle: true` — bundle dependencies (trừ peer Playwright).
- `eslint.config.mjs` — flat config ESLint 9+.
- `skipLibCheck` — skip type check declaration file — tăng tốc build.
