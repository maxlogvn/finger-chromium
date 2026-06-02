# Overview: Browser Launcher

## Mục tiêu

Xây dựng module spawn Chromium process và phát hiện DevTools listening URL để CDP có thể giao tiếp.

## Kết quả

- `src/plugin/launcher/index.ts`: 99 dòng.
- `launch()` function spawn Chromium, parse DevTools URL.
- `Browser` interface với `close()` method.
- `close()` dùng `taskkill /T /F` để kill toàn bộ process tree.

## Kiểm tra

- `npm run lint` -- 0 errors.
- Dùng `readline` (built-in), `spawn`, `exec` (built-in).

## Sai lệch so với kế hoạch

| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| `configure()` có logic | `configure()` là no-op | Chưa implement, dự phòng cho tương lai |

## Ghi chú kỹ thuật

- `readline.createInterface` được tạo riêng cho stderr và stdout.
- Regex pattern: `/DevTools listening on (.*)/` -- match toàn bộ URL.
- `close()` dùng `taskkill /T /F` -- chỉ chạy trên Windows. Nếu port sang nền tảng khác, cần thay bằng `kill` Unix.

---
