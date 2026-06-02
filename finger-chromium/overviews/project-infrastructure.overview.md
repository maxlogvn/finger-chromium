# Overview: Hạ tầng dự án (Project Infrastructure)

## Mục tiêu

Tạo nền tảng dự án vững chắc cho việc phát triển thư viện fingerprint-chromium-engine, bao gồm:
- Cấu hình TypeScript strict mode, target ES2022.
- Build pipeline với tsup (ESM + CJS + DTS).
- ESLint + Prettier cho code quality.
- Mocha + tsx cho testing với browser thật.
- Cấu trúc thư mục rõ ràng cho 5 nhánh code chính.

## Kết quả

- `package.json` đã cấu hình đầy đủ: 11 dependencies, 17 devDependencies, peerDependencies playwright-core >=1.60.0, 8 scripts.
- `tsconfig.json` strict mode, paths alias `@src/*`.
- `tsup.config.ts` với `dts.resolve: false` (quan trọng: tránh crash với playwright-core types), 13 external packages.
- `eslint.config.ts` dùng typescript-eslint, `consistent-type-imports: error`.
- `.prettierrc` tabs, single quotes, 100 printWidth.
- `.mocharc.yml` tsx loader, 10s timeout, `--exit`.
- `src/index.ts` re-export Chromium + types.
- 5 thư mục source code + docs/ đã tạo.
- Build thành công: `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (DTS).

## Kiểm tra

- `npm run lint` -- 0 errors, 16 warnings (all pre-existing `no-explicit-any`).
- `npm run build` -- tsup build thành công (ESM 2.3MB, CJS 2.3MB trước khi minify).
- Các test cần browser thật, không chạy được nếu chưa cài Playwright Chromium.

## Sai lệch so với kế hoạch

| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| `npm run clean` dùng lệnh cross-platform | Dùng `tsup --clean` (tương thích Windows) | Đã fix -- thay `rm -rf` bằng tsup built-in clean |
| `src/adapter/playwright/loader.ts` không được nhắc đến trong plan gốc | Đã có file này | Plan gốc thiếu, đã phát hiện và thêm vào trong quá trình format/comment codebase |
| `format` script chỉ chạy `src/` | Chỉ format `src/`, không format `tests/` hay `docs/` | Có chủ đích -- tests và docs có thể có format khác (ví dụ: test data, markdown) |

## Ghi chú kỹ thuật

- **`dts.resolve: false` là bắt buộc.** Nếu set `true`, tsup crash vì `rollup-plugin-dts` không handle được complex types từ playwright-core (conditional types với key remapping). Đây là lỗi đã biết của rollup-plugin-dts, fix bằng cách set resolve: false.
- **External list có 13 packages.** Thiếu một package sẽ làm esbuild bundle package đó vào dist, gây tăng kích thước và conflict version. Cần kiểm tra list này mỗi khi thêm dependency mới.
- **`skipNodeModulesBundle: true` phải ở ROOT level** của tsup config. Nếu đặt trong `dts.compilerOptions`, nó không có tác dụng.
- **`createRequire(import.meta.url)`** trong `src/loader/index.ts` cho phép dùng `require()` từ ESM context. `import.meta.url` trỏ tới file hiện tại, dùng làm base path.
- Tất cả file source code đã được format và comment theo CONVENTIONS.md (header, section divider, JSDoc, step comments, WHY).

---
