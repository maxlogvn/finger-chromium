# Plan: Hạ tầng dự án (Project Infrastructure)

## Các bước thực hiện

- [x] **Bước 1: Tạo `package.json`**
  - Thiết lập `name`, `version`, `type: module`.
  - Khai báo `exports` cho ESM + CJS.
  - Thêm `peerDependencies` với `playwright-core >=1.60.0`.
  - Thêm `dependencies`: `async-lock`, `axios`, `chokidar`, `chrome-remote-interface`, `compare-versions`, `debug`, `dedent`, `extract-zip`, `fast-glob`, `once`, `proper-lockfile`.
  - Thêm `devDependencies`: TypeScript ~5.8, tsup ~8.5, Mocha ~11.3, ESLint ~10.0, Prettier ~3.8, tsx, jiti, dotenv, các type definitions.
  - Config scripts: `lint`, `lint:fix`, `format`, `test`, `clean`, `build`, `dev`.
  - Config `os: ["win32"]` -- chỉ Windows.
  - Config `engines.node: ">=18.0.0"`.

- [x] **Bước 2: Cấu hình `tsconfig.json`**
  - `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`.
  - `strict: true`, `esModuleInterop: true`, `skipLibCheck: true`.
  - `paths: { "@src/*": ["src/*"] }` -- alias cho import nội bộ.
  - `include: ["src/**/*"]`, `exclude: ["dist", "tests/**/*", "node_modules"]`.

- [x] **Bước 3: Cấu hình `tsup.config.ts`**
  - Entry: `src/index.ts`, format `['cjs', 'esm']`, target `node18`.
  - `dts: { resolve: false }` -- tránh crash với playwright-core types.
  - `skipNodeModulesBundle: true` (root level).
  - `minify: true`, `treeshake: true`, `shims: true`.
  - External: 14 packages (playwright-core, async-lock, axios, chokidar, chrome-remote-interface, compare-versions, debug, dedent, extract-zip, fast-glob, once, proper-lockfile, dotenv).

- [x] **Bước 4: Cấu hình ESLint + Prettier**
  - `eslint.config.ts`: Dùng `typescript-eslint` với recommended rules.
  - Rules: `consistent-type-imports: error`, `no-explicit-any: warn`, `no-unused-vars: warn`.
  - `.prettierrc`: `@cheshire-caat/prettier-config`, tabs, single quotes, trailingComma all, 100 printWidth.
  - Format script chỉ chạy `src/`.

- [x] **Bước 5: Cấu hình Mocha + tsx**
  - `.mocharc.yml`: spec `tests/**/*.ts`, loader `tsx`, timeout 10000ms, `exit: true`.
  - Test với browser thật, không mock.

- [x] **Bước 6: Tạo cấu trúc thư mục `src/` và `docs/`**
  - Tạo các thư mục: `src/types/`, `src/common/`, `src/loader/`, `src/plugin/`, `src/adapter/playwright/`.
  - Tạo `docs/designs/`, `docs/specs/`, `docs/plans/`, `docs/products/`, `docs/overviews/`.

- [x] **Bước 7: Tạo `src/index.ts`**
  - Re-export `PWChromium` từ `./types/PWChromium`.
  - Re-export `Chromium`, `FetchOptions`, `FingerprintOptions`, `Launcher`, `PluginLaunchOptions`, `ProfileOptions`, `ProxyOptions` từ `./adapter/playwright/chromium`.

## File liên quan

| File | Trạng thái |
|---|---|
| `package.json` | Đã tạo |
| `tsconfig.json` | Đã tạo |
| `tsup.config.ts` | Đã tạo |
| `eslint.config.ts` | Đã tạo |
| `.prettierrc` | Đã tạo |
| `.mocharc.yml` | Đã tạo |
| `project.xml` | Đã tạo (file engine BAS) |
| `src/index.ts` | Đã tạo |
| `src/types/` | 5 files |
| `src/common/` | 1 file |
| `src/loader/` | 1 file |
| `src/plugin/` | 6 files + subdirectories |
| `src/adapter/playwright/` | 5 files |

## Kiểm tra

- `npm run lint` -- 0 errors (16 warnings pre-existing về `no-explicit-any`)
- `npm run build` -- build thành công dist/index.js + dist/index.cjs + dist/index.d.ts
- `npm test` -- chạy Mocha tests (cần browser thật, phải có `npx playwright install chromium`)

## Ghi chú

- **Pre-existing bug:** `npm run clean` dùng `rm -rf dist` -- không chạy trên Windows. Cần sửa thành `node:fs` `rmSync(path, { recursive: true, force: true })`.
- `dotenv` là devDependency nhưng vẫn trong external list của tsup. Giữ để tránh crash nếu code dynamic import dotenv.
- `@cheshire-caat/prettier-config` là shared config -- cần đảm bảo package này được cài trong devDependencies.
- Khi thêm dependency mới, cần thêm vào external list nếu không muốn bundle.

---
