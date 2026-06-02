# Design: Hạ tầng dự án (Project Infrastructure)

## Vấn đề

Dự án fingerprint-chromium-engine là thư viện Node.js điều khiển Chromium chống bot detection. Cần một hạ tầng phát triển hiện đại, đáng tin cậy để đảm bảo chất lượng code, trải nghiệm dev tốt và dễ dàng publish.

## Yêu cầu

1. Hỗ trợ TypeScript strict mode, target ES2022
2. Bundle được cả ESM lẫn CJS
3. Linting và format code nhất quán
4. Test runner chạy được với browser thật
5. Dev tooling hỗ trợ hot reload, biến môi trường
6. Scripts npm đầy đủ cho dev, lint, test, build

## Giải pháp

### TypeScript Config

- `strict: true` -- bắt toàn bộ lỗi kiểu tiềm ẩn
- `target: ES2022` -- tận dụng async/await, private fields, top-level await
- `moduleResolution: Node` -- tương thích với Node.js >= 18

Lý do chọn strict mode: đây là thư viện điều khiển trình duyệt, sai sót kiểu có thể dẫn đến lỗi runtime nghiêm trọng (treo browser, rò rỉ tài nguyên).

### Build Tooling

Dùng `tsup` (dựng trên esbuild) vì:
- Nhanh hơn `tsc` 10-20 lần
- Xuất đồng thời ESM + CJS + DTS chỉ một lệnh
- Cấu hình tối thiểu, dễ maintain

Output:
- `dist/index.js` (ESM)
- `dist/index.cjs` (CommonJS)
- `dist/index.d.ts` + `dist/index.d.cts` (type definitions)

### Linting & Format

Tách biệt ESLint (logic) và Prettier (style):
- ESLint: `@typescript-eslint` rules, cấm `any`, yêu cầu `import type`
- Prettier: tabs, single quotes, 100 printWidth, no trailingComma

Format tabs được chọn vì:
- Mỗi developer có thể cấu hình độ rộng tab theo ý thích
- Dễ căn chỉnh multi-line hơn spaces
- Quán triệt trên toàn bộ dự án

### Test Runner

Dùng Mocha + tsx loader:
- Mocha: đơn giản, linh hoạt, không opinionated
- tsx: chạy TypeScript trực tiếp, không cần build trước
- Test với browser thật (Playwright), không mock

### Dev Tooling

- `dotenv`: quản lý biến môi trường (BABLOSOFT_KEY, ...)
- `jiti`: chạy TypeScript config files (tsup.config.ts)
- `tsx`: chạy script TypeScript trực tiếp trong development

### package.json Scripts

| Script | Lệnh | Mục đích |
|---|---|---|
| `dev` | `tsx` | Chạy TypeScript trực tiếp |
| `lint` | `eslint src/` | Kiểm tra code quality |
| `lint:fix` | `eslint src/ --fix` | Tự động sửa lỗi ESLint |
| `format` | `prettier --write src/` | Format code |
| `format:check` | `prettier --check src/` | Kiểm tra format |
| `test` | `mocha` | Chạy test suite |
| `build` | `tsup` | Bundle ESM + CJS |
| `clean` | `rm -rf dist` | Xoá thư mục dist |

## So sánh phương án

### TypeScript vs JavaScript

- JS: phát triển nhanh hơn, không cần compile. Không phù hợp vì thư viện phức tạp, nhiều interface.
- **TS (chọn)**: an toàn kiểu, tự động document qua type, phát hiện lỗi sớm.

### tsup vs tsc

- tsc: chậm, chỉ xuất JS thuần, cần thêm công cụ cho bundle. Quen thuộc.
- **tsup (chọn)**: nhanh, xuất ESM + CJS + DTS, built-in minify.

### Mocha vs Jest vs Vitest

- Jest: cần cấu hình phức tạp cho ESM, heavy.
- Vitest: nhanh, tương thích Jest API. Mới, ít tài liệu cho Node.js thuần.
- **Mocha (chọn)**: đơn giản, linh hoạt, không opinionated, dễ cấu hình với tsx.

## Kết luận

Chọn bộ công nghệ: TypeScript strict + tsup + ESLint/Prettier + Mocha/tsx + dotenv/jiti. Đây là stack phổ biến, đáng tin cậy, phù hợp với thư viện Node.js hiện đại.

---

Xem thêm: [Spec](../specs/project-infrastructure.spec.md) | [Plan](../plans/project-infrastructure.plan.md)
