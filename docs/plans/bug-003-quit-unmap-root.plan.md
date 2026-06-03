# Plan: Bug #3 — `quit()` xoá toàn bộ `BROWSER_RUNNING_DIR`

## Các bước thực hiện

- [ ] Bước 1: Code — đổi `unmap(BROWSER_RUNNING_DIR)` thành `dispose()`
    - Làm gì: Sửa 1 dòng trong `quit()` method.
    - File liên quan: `src/adapter/playwright/chromium.ts:211`
    - Thay đổi: `this.dataManager.unmap(BROWSER_RUNNING_DIR)` → `this.dataManager.dispose()`
    - Ghi chú: `dispose()` là method public của `AdapterDataManager`, semantic đã đúng.

- [ ] Bước 2: Kiểm tra code
    - Chạy `npm run lint` — ESLint + Prettier.
    - Chạy `npm run typecheck` — TypeScript type check.
    - Chạy `npm run build` — tsup bundle.

- [ ] Bước 3: Rà soát tài liệu liên quan
    - Quét `docs/` tìm file bị ảnh hưởng bởi bug fix này.
    - Cập nhật nếu cần.

- [ ] Bước 4: Viết overview
    - File: `docs/overviews/bug-003-quit-unmap-root.overview.md`
    - So sánh plan với thực tế, ghi lại sai lệch nếu có.

- [ ] Bước 5: Cập nhật Roadmap
    - Chuyển trạng thái Bug #3 thành "Hoàn thành".
    - Cập nhật trường Tài liệu với link đến design, spec, plan, overview.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

## Ghi chú

- Bug fix rất nhỏ (1 dòng), rủi ro thấp.
- `dispose()` đã tồn tại sẵn và được test qua các test hiện tại.
- Cần verify rằng import `BROWSER_RUNNING_DIR` trong `chromium.ts` không còn được dùng ở dòng 211 nữa. Nếu `BROWSER_RUNNING_DIR` chỉ còn dùng trong constructor (dòng 78) và export, thì không sao — các file khác import nó (vd `data.ts`) vẫn cần.
