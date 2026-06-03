# Plan: Bug #9 — `BrowserEngine.launch()` dùng `Error` thô

## Các bước thực hiện

- [ ] Bước 1: Sửa file `src/adapter/playwright/chromium.ts`
    - Làm gì: 
      1. Thêm `import { PluginError } from '../../plugin/errors'` ở gần các import khác.
      2. Đổi `throw new Error(...)` → `throw new PluginError(...)` ở 3 dòng (136, 164, 167).
    - File liên quan: `src/adapter/playwright/chromium.ts`
    - Phụ thuộc: Không.

- [ ] Bước 2: Kiểm tra
    - Làm gì: Chạy `npm run lint` + `npm run typecheck` + `npm run build`.
    - Phụ thuộc: Bước 1 hoàn thành.

## Kiểm tra

- `npm run lint` — không lỗi ESLint mới.
- `npm run typecheck` — không lỗi type.
- `npm run build` — bundle thành công (ESM + CJS).

## Ghi chú

Đây là 3 lỗi cùng loại trong cùng file — fix một lần cho gọn.
