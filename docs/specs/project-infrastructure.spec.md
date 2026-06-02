# Spec: Hạ tầng dự án (Project Infrastructure)

## Mô tả

Cấu hình và thiết lập hạ tầng phát triển cho dự án fingerprint-chromium-engine: TypeScript, build, lint, test, dev tooling và npm scripts.

## Yêu cầu

1. TypeScript strict mode, target ES2022
2. tsup bundle: ESM (`dist/index.js`) + CJS (`dist/index.cjs`) + DTS
3. ESLint + Prettier với config nhất quán
4. Mocha + tsx loader cho test
5. dotenv + jiti cho dev
6. package.json scripts: dev, lint, test, build, format

## Thiết kế

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src"]
}
```

### Build (`tsup.config.ts`)

- Entry: `src/index.ts`
- Format: `['esm', 'cjs']`
- DTS: true (xuất type definitions riêng)
- Clean: true (xoá dist trước khi build)
- Platform: Node.js >= 18

### ESLint

- Base: `eslint:recommended` + `@typescript-eslint/recommended`
- Rules đặc biệt:
  - `@typescript-eslint/consistent-type-imports`: error (ưu tiên `import type`)
  - `@typescript-eslint/no-explicit-any`: warn (cho phép nhưng cảnh báo)
  - `no-unused-vars`: error

### Prettier

- Tabs (thay vì spaces)
- Single quotes
- Print width: 100
- No trailing commas
- Trình tự: `prettier --write` → `eslint --fix`

### Test (`mocha`)

- Loader: `tsx` (chạy TypeScript trực tiếp)
- Pattern: `tests/**/*.test.ts`
- Timeout: 60000ms (browser thật cần thời gian)
- Không mock Playwright -- test với browser thật

### Dev tooling

- `dotenv`: load `.env` file vào `process.env`
- `jiti` (dùng nội bộ tsup): load `tsup.config.ts` mà không cần compile
- `tsx`: chạy file `.ts` trực tiếp trong dev

## Components

Không có component riêng. Đây là các file cấu hình:

| File | Vai trò |
|---|---|
| `tsconfig.json` | TypeScript compiler options |
| `tsup.config.ts` | Build configuration |
| `.eslintrc.json` | ESLint rules |
| `.prettierrc` | Prettier formatting rules |
| `.mocharc.yml` | Mocha test configuration |
| `.env` (gitignored) | Biến môi trường local |
| `package.json` | Scripts, dependencies |

## API / Data flow

Không có API runtime. Các config này chỉ dùng trong quá trình phát triển (dev/build/test).

## Xử lý lỗi

- Build lỗi → dừng ngay, in stack trace từ tsup
- ESLint lỗi → chặn commit (nếu dùng husky/lint-staged trong tương lai)
- Test fail → in diff chi tiết từ Mocha

## Kiểm tra

- `npm run lint` -- 0 errors
- `npm run build` -- ESM + CJS + DTS thành công
- `npm test` -- tất cả test pass

---

Xem thêm: [Design](../designs/project-infrastructure.design.md) | [Plan](../plans/project-infrastructure.plan.md)
