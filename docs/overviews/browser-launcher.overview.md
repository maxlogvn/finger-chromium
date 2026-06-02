# Overview: Browser Launcher

File: `src/plugin/launcher/index.ts` (99 dòng).

## Lưu ý kỹ thuật

- `readline.createInterface` dùng để parse stderr line-by-line. Lý do không dùng `stream.on('data')`: stderr có thể gộp nhiều dòng trong một chunk, khó parse.
- `configure()` của Browser trả về là no-op -- được override sau bởi `config.ts` (trong `_launch()`). Pattern này dùng để giữ interface đồng nhất.
- `taskkill` là Windows API. Project chỉ hỗ trợ win32 nên không cần cross-platform fallback.
- DEVSERVER_RE dùng `gi` flags: `g` cho global (nhiều match), `i` cho case-insensitive.
