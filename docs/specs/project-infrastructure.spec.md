# Spec: Hạ tầng dự án (Project Infrastructure)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Hạ tầng dự án bao gồm cấu trúc thư mục, build pipeline (tsup), linting (ESLint), formatting (Prettier), testing (Mocha + tsx), và các file cấu hình. Đây là nền tảng để phát triển tất cả tính năng khác.

`fingerprint-chromium-engine` là thư viện Node.js dạng ESM + CJS, chỉ hỗ trợ Windows (win32) 32-bit và 64-bit. Fingerprint được inject ở tầng C/C++ trước khi browser khởi động.

## Yêu cầu

- Build ra 2 định dạng: ESM (`dist/index.js`) và CJS (`dist/index.cjs`).
- Kèm declaration file (`.d.ts`) nhưng không resolve type từ node_modules (`dts.resolve: false`).
- Linting: `consistent-type-imports` (error) + `no-explicit-any` (warn).
- Format: tabs, single quotes, 100 printWidth, trailingComma all.
- Test chạy với browser thật (Playwright Chromium), không mock.
- Chỉ hỗ trợ Windows (win32) — `os: ["win32"]`.
- Node.js >= 18 (`engines.node: ">=18.0.0"`).
- `playwright-core` là peer dependency (>= 1.60.0).
- CJS (require) cần wrapper function vì ESM không có `require` native.

## Thiết kế

### Kiến trúc tổng quan

```
src/index.ts (entry point công khai)
  → tsup bundle
    → dist/index.js   (ESM)
    → dist/index.cjs  (CJS)
    → dist/index.d.ts (DTS, không resolve node_modules)

Thư mục src/:
  ├── types/          Định nghĩa TypeScript types (5 files)
  ├── plugin/         Core engine + connector + launcher + cleaner + mutex
  ├── adapter/playwright/  Playwright bridge + utils + loader + data
  ├── common/         In-browser scripts
  └── loader/         Generic module loader
```

### Export công khai

```ts
export { type PWChromium } from './types/PWChromium';
export {
  Chromium,
  type FetchOptions,
  type FingerprintOptions,
  type Launcher,
  type PluginLaunchOptions,
  type ProfileOptions,
  type ProxyOptions,
} from './adapter/playwright/chromium';
```

Tham chiếu design doc: `docs/designs/project-infrastructure.design.md`.

## API / Data flow

### Build pipeline

```
tsup.config.ts
  entry: src/index.ts
  format: ['cjs', 'esm']
  dts: resolve: false
  clean: true
  external: 13 packages (playwright-core, chrome-remote-interface, ...)

npm run build → dist/ có 3 files
```

### Lint pipeline

```
eslint.config.ts
  - typescript-eslint
  - consistent-type-imports: error
  - no-explicit-any: warn

prettier (.prettierrc)
  - tabs, single quotes, 100 printWidth, trailingComma all
```

### Test pipeline

```
.mocharc.yml
  spec: tests/**/*.ts
  loader: tsx (TypeScript execution)
  timeout: 10s
  exit: true
```

## Components

| File/Thư mục | Vai trò |
|---|---|
| `package.json` | Thông tin package, scripts, dependencies. `"type": "module"`, `"os": ["win32"]`, peer dep `playwright-core >= 1.60.0` |
| `tsconfig.json` | `target: ES2022`, `strict: true`, `moduleResolution: Bundler`, paths alias `@src/*` |
| `tsup.config.ts` | Bundle ESM + CJS + DTS, 13 external packages |
| `eslint.config.ts` | ESLint flat config với typescript-eslint |
| `.prettierrc` | Format: tabs, single quotes, 100 printWidth, trailingComma all |
| `.mocharc.yml` | Mocha config: tsx loader, 10s timeout, exit |
| `src/index.ts` | Entry point — re-export Chromium + types |
| `src/` | 5 nhánh: types, plugin, adapter/playwright, common, loader |
| `dist/` | Build output (gitignored) |

### Build scripts (package.json)

| Script | Lệnh | Mô tả |
|---|---|---|
| `build` | `tsup` | Bundle ESM + CJS + DTS |
| `lint` | `eslint src/ tests/` | ESLint toàn bộ source |
| `format` | `prettier --write "src/**/*.ts"` | Format code |
| `test` | `mocha` | Chạy Mocha tests |
| `clean` | `tsup --clean` | Xoá dist (Windows-compatible) |
| `prepare` | `npm run build` | Auto-build khi cài từ GitHub |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Build lỗi (TypeScript compile fail) | tsup/esbuild báo lỗi — fix syntax |
| Lint lỗi `consistent-type-imports` | ESLint error — dùng `import type { ... }` |
| Lint lỗi `no-explicit-any` | ESLint warning — có thể bỏ qua nếu cần |
| Test lỗi (browser không có) | Mocha report + stack trace. Cần `npx playwright install chromium` |
| Windows clean script không có `rm -rf` | Dùng `tsup --clean` thay thế |

## Kiểm tra

- Happy path: `npm run lint` → 0 errors, `npm run build` → dist/ có 3 files.
- Edge case: khi thiếu playwright-core → báo peer dependency warning khi npm install.
- Edge case: `dts.resolve: true` → tsup crash với playwright-core types.
