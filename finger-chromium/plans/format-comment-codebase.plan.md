# Plan: Format và Comment lại toàn bộ Codebase

## Các bước thực hiện

### Nhóm 1 -- Core (ưu tiên cao nhất)

- [x] Bước 1: Format `src/plugin/index.ts` (157 dòng) -- header, section divider, JSDoc all exports, step comments
- [x] Bước 2: Format `src/adapter/playwright/chromium.ts` (154 dòng) -- thêm header, JSDoc còn thiếu
- [x] Bước 3: Format `src/adapter/playwright/engine.ts` (76 dòng) -- header, divider, JSDoc, step comments
- [x] Bước 4: Format `src/adapter/playwright/data.ts` (64 dòng) -- header, JSDoc, giải thích WHY
- [x] Bước 5: Format `src/adapter/playwright/utils.ts` (88 dòng) -- header, JSDoc, step comments
- [x] Bước 6: Format `src/adapter/playwright/loader.ts` (5 dòng) -- header
- [x] Bước 7: Format `src/loader/index.ts` (40 dòng) -- header, divider, JSDoc

### Nhóm 2 -- Hỗ trợ (ưu tiên trung bình)

- [x] Bước 8: Format `src/plugin/browser.ts` (59 dòng) -- header, divider, JSDoc, step comments
- [x] Bước 9: Format `src/plugin/config.ts` (57 dòng) -- header, divider, JSDoc, giải thích WHY
- [x] Bước 10: Format `src/plugin/cleaner.ts` (62 dòng) -- header, JSDoc, giải thích WHY
- [x] Bước 11: Format `src/plugin/utils.ts` (85 dòng) -- header, divider, JSDoc all exports
- [x] Bước 12: Format `src/plugin/connector/index.ts` (60 dòng) -- header, JSDoc
- [x] Bước 13: Format `src/plugin/connector/engine.ts` (343 dòng) -- header, step comments, kiểm tra JSDoc còn thiếu
- [x] Bước 14: Format `src/plugin/connector/utils.ts` (28 dòng) -- header, JSDoc
- [x] Bước 15: Format `src/plugin/connector/pcapServer/index.ts` (36 dòng) -- header, JSDoc, giải thích WHY
- [x] Bước 16: Format `src/plugin/launcher/index.ts` (74 dòng) -- header, JSDoc all exports
- [x] Bước 17: Format `src/plugin/mutex/index.ts` (40 dòng) -- header, JSDoc
- [x] Bước 18: Format `src/common/index.ts` (10 dòng) -- header, JSDoc

### Nhóm 3 -- Types & misc (ưu tiên thấp)

- [x] Bước 19: Format `src/types/PWChromium.ts` (160 dòng) -- thêm header
- [x] Bước 20: Format `src/types/fingerprint.ts` (86 dòng) -- thêm header
- [x] Bước 21: Format `src/types/proxy.ts` (205 dòng) -- thêm header
- [x] Bước 22: Format `src/types/profile.ts` (26 dòng) -- thêm header
- [x] Bước 23: Format `src/types/fetch.ts` (132 dòng) -- thêm header
- [x] Bước 24: Format `src/plugin/errors.ts` (52 dòng) -- thêm header, JSDoc
- [x] Bước 25: Format `src/index.ts` (6 dòng) -- thêm header, JSDoc

### Kiểm tra

- [x] Bước 26: Chạy `npm run format` (Prettier)
- [x] Bước 27: Chạy `npm run lint` (ESLint)
- [x] Bước 28: Chạy `npm run build` (tsup bundle)

### Tài liệu

- [x] Bước 29: Viết overview

### Cập nhật Roadmap

- [x] Bước 30: Đánh dấu "Hoàn thành" trong ROADMAP.md

## Kiểm tra

- `npm run format` -- Prettier format lại toàn bộ
- `npm run lint` -- ESLint không lỗi mới
- `npm run build` -- tsup build thành công

## Ghi chú

- Không sửa logic code, chỉ comment
- Types (nhóm 3) đã có JSDoc tốt, chỉ cần thêm header
- `connector/engine.ts` là file lớn nhất (343 dòng), cần thêm step comments và header

---

Xem thêm: [Design](../designs/format-comment-codebase.design.md) | [Spec](../specs/format-comment-codebase.spec.md)
