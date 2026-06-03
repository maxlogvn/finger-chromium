# Plan: Bug #2 — Error classes không export trong public API

## Các bước thực hiện

- [ ] Bước 1: Code — thêm export block vào `src/index.ts`
    - Làm gì: Thêm `export { PluginError, MissingKeyError, InvalidEngineError, EngineTimeoutError, RequestTimeoutError } from './plugin/errors';`
    - File liên quan: `src/index.ts`
    - Ghi chú: Đặt sau import `PWChromium`, trước import `BrowserEngine`.

- [ ] Bước 2: Kiểm tra
    - `npm run lint`, `npm run build`, `npm test`

- [ ] Bước 3: Rà soát tài liệu liên quan
    - Quét `docs/` tìm file bị ảnh hưởng.

- [ ] Bước 4: Viết overview

- [ ] Bước 5: Cập nhật Roadmap

## Kiểm tra

- `npm run lint`
- `npm run build`
- `npm test`
- Kiểm tra thủ công: chạy `node -e "const m = require('./dist/index.cjs'); console.log(Object.keys(m).filter(k => k.includes('Error')))"` để verify export

## Ghi chú

- Thay đổi rất nhỏ (thêm 1 block export).
- Các error class đã được import nội bộ, chỉ cần re-export thêm.
