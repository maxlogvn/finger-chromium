# Plan: Format và Comment lại toàn bộ Codebase

## Các bước thực hiện

### Nhóm 1 -- Core (ưu tiên cao nhất)
- [x] Bước 1-7: Format `plugin/index.ts`, `adapter/playwright/chromium.ts`, `engine.ts`, `data.ts`, `utils.ts`, `loader.ts`, `loader/index.ts`

### Nhóm 2 -- Hỗ trợ
- [x] Bước 8-18: Format `plugin/browser.ts`, `config.ts`, `cleaner.ts`, `utils.ts`, `connector/*`, `launcher/index.ts`, `mutex/index.ts`, `common/index.ts`

### Nhóm 3 -- Types & misc
- [x] Bước 19-25: Format `types/*`, `plugin/errors.ts`, `index.ts`

### Kiểm tra
- [x] Bước 26-28: `npm run format`, `npm run lint`, `npm run build`

### Tài liệu
- [x] Bước 29: Viết overview
- [x] Bước 30: Cập nhật Roadmap

## Kiểm tra

- `npm run lint` -- 0 errors.
- `npm run build` -- tsup build thành công.

## Ghi chú

- Non-feature task: chỉ cần overview, không cần product doc.
- Plan phát hiện thiếu file `src/adapter/playwright/loader.ts` -- đã thêm bổ sung.
- 3 lỗi `consistent-type-imports` được fix trong quá trình format.
