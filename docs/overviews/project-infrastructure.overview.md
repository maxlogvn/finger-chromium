# Overview: Hạ tầng Dự án (Project Infrastructure)

## Tóm tắt

Đã thiết lập toàn bộ hạ tầng dự án: package.json (ESM + CJS), TypeScript strict mode ES2022, tsup build (bundle + DTS), ESLint + Prettier (flat config), Mocha + tsx loader, cấu trúc thư mục src/ và docs/.

## Cấu hình chi tiết

**package.json:**
- `"type": "module"` -- ESM mặc định
- `main: "./dist/index.cjs"`, `module: "./dist/index.js"` -- dual format
- Scripts: lint, test, build, prepare, clean, dev
- 11 dependencies chính (playwright-core là peer)
- `exports` field cho ESM + CJS resolution

**TypeScript (tsconfig.json):**
- `strict: true` -- toàn bộ strict checks
- `target: ES2022`, `module: ES2022`
- `moduleResolution: bundler`
- `skipLibCheck: true` -- tăng tốc build

**tsup (tsup.config.ts):**
- Entry: `src/index.ts`
- Format: `['esm', 'cjs']`
- `dts: true` -- tự động .d.ts + .d.ts.map
- `bundle: true` -- bundle dependencies
- `clean: true` -- xoá dist/ trước build

**ESLint (eslint.config.mjs):**
- Flat config (ESLint 9+)
- `typescript-eslint` strict preset
- `no-explicit-any: warn` (không error)

**Prettier (.prettierrc):**
- single quote, tabs, trailingComma all, printWidth 100

**Mocha (.mocharc.yml):**
- `spec: tests/**/*.test.ts`
- `timeout: 30000`
- `loader: tsx/esm`

## Tham chiếu code

| Component | File |
|---|---|
| Scripts + config | `package.json` |
| TypeScript config | `tsconfig.json` |
| Build config | `tsup.config.ts` |
| ESLint config | `eslint.config.mjs` |
| Prettier config | `.prettierrc` |
| Mocha config | `.mocharc.yml` |
| Git ignore | `.gitignore` |
| Public exports | `src/index.ts` |

## Quyết định thiết kế

- **Dual format (ESM + CJS)**: Hỗ trợ cả `import` và `require`. File `.js` cho ESM, `.cjs` cho CJS.
- **`prepare` script**: `npm run build` tự động chạy khi `npm install` từ GitHub -- user không cần build thủ công.
- **`clean` script**: `tsup --clean` thay `rm -rf` -- tương thích Windows.
- **`bundle: true`**: Bundle tất cả dependency (trừ peer) vào 1 file. Giảm số lượng file trong `dist/`, dễ publish.
- **`dts: true`**: Tự động generate `.d.ts` + `.d.ts.map`. Không cần `tsc` riêng cho type declaration.
- **Flat config (ESLint 9+)**: `eslint.config.mjs` thay `.eslintrc`. Tương thích future ESLint versions.

## Lưu ý

- Output: ESM (`dist/index.js`) + CJS (`dist/index.cjs`) + types (`dist/index.d.ts`).
- `npm run clean` dùng `tsup --clean` thay `rm -rf` để tương thích Windows.
- `skipLibCheck` -- skip type check declaration files, tăng tốc build.
- Playwright Core là peer dependency -- user tự cài.
- `src/index.ts` export: `Chromium` singleton + tất cả types.

## Tài liệu liên quan

- `docs/designs/project-infrastructure.design.md`
- `docs/specs/project-infrastructure.spec.md`
- `docs/plans/project-infrastructure.plan.md`
- `docs/products/project-infrastructure.product.md`
