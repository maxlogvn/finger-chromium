# Product: Hạ tầng dự án

## Tổng quan

Dự án fingerprint-chromium-engine sử dụng bộ công nghệ phát triển hiện đại để đảm bảo chất lượng code và trải nghiệm dev tốt.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | TypeScript 5.8, strict mode, target ES2022 |
| Bundle | tsup 8.5 (esbuild) -- xuất ESM + CJS + DTS |
| Linting | ESLint 10 + `@typescript-eslint` |
| Format | Prettier 3.8 (tabs, single quotes, 100 printWidth) |
| Test | Mocha 11 + tsx loader |
| Dev | dotenv, tsx |

## Các lệnh cơ bản

```bash
npm run dev        # Chạy TypeScript trực tiếp (tsx)
npm run build      # Bundle ESM + CJS + DTS (tsup)
npm run lint       # ESLint
npm run format     # Prettier format
npm test           # Chạy test (Mocha)
```

## Cấu trúc thư mục sau khi build

```
dist/
├── index.js       # ESM
├── index.cjs      # CommonJS
├── index.d.ts     # Type definitions (ESM)
└── index.d.cts    # Type definitions (CJS)
```

## Yêu cầu hệ thống

- Node.js >= 18
- Windows (win32) -- dự án chỉ hỗ trợ Windows
- Playwright Core >= 1.60 (peer dependency)

## Lưu ý

- `npm run clean` hiện dùng `rm` (Unix) -- không tương thích Windows. Cần chạy `npx tsup` trực tiếp để build.
- Luôn chạy `npm run lint` trước khi commit.
- File `.env` chứa biến môi trường (BABLOSOFT_KEY, ...) đã được gitignore.
