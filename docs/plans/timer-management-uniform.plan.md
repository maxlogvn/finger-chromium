# Plan: Đồng nhất style timer giữa các module

## Các bước thực hiện

- [ ] Bước 1: Tạo `src/common/timer.ts`
    - Làm gì: Tạo file mới với `sleep()`, `withTimeout()`, `createTimer()`, `TimeoutError`
    - File liên quan: `src/common/timer.ts`
    - Ghi chú: Dùng `timers/promises` làm nền. `createTimer()` dùng `ref: false` để unref tự động.

- [ ] Bước 2: Cập nhật `src/plugin/config.ts`
    - Làm gì: Xoá `import { setTimeout } from 'timers/promises'`, thêm `import { sleep } from '../../common/timer'`. Thay `await setTimeout(n)` bằng `await sleep(n)`.
    - File liên quan: `src/plugin/config.ts`
    - Phụ thuộc: Bước 1

- [ ] Bước 3: Cập nhật `src/plugin/connector/engine.ts`
    - Làm gì: Thay 3 chỗ dùng callback-style `setTimeout().unref()` + `clearTimeout` bằng `createTimer()`:
        - Request timeout (dòng ~285-288, 301)
        - Close timeout (dòng ~291-294, 302)
        - SIGKILL fallback (dòng ~421-423, 426)
    - File liên quan: `src/plugin/connector/engine.ts`
    - Phụ thuộc: Bước 1

- [ ] Bước 4: Cập nhật `src/plugin/connector/index.ts`
    - Làm gì: Thay callback-style `notifyTimer` (dòng ~118, 126, 133) bằng `createTimer()`
    - File liên quan: `src/plugin/connector/index.ts`
    - Phụ thuộc: Bước 1

- [ ] Bước 5: Chạy kiểm tra
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`
    - Phụ thuộc: Bước 2-4

## Kiểm tra

- `npm run lint` — ESLint không lỗi
- `npm run typecheck` — TypeScript type check pass
- `npm run build` — tsup bundle ESM + CJS pass
- `npm test` — tất cả test cases pass (không có test mới cần thêm, chỉ verify behavior không đổi)

## Ghi chú

- `createTimer()` dùng `ref: false` để tự động `.unref()` — không cần gọi `.unref()` thủ công
- Test hiện tại mock `setTimeout` gián tiếp qua behavior — không cần sửa test vì behavior không đổi
- `TimeoutError` là class mới, dùng cho `withTimeout()` — connector vẫn throw `RequestTimeoutError` riêng
