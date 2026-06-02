
## Core

| Công nghệ | Phiên bản | Ghi chú |
|---|---|---|
| TypeScript | ~5.8 | Strict mode, target ES2022 |
| Node.js | >= 18 | Windows-only (win32) |
| Playwright Core | >= 1.60 | Peer dependency |

## Build & Bundle

| Công nghệ | Phiên bản |
|---|---|
| tsup | ~8.5 |
| tsc | ~5.8 |

## Dependencies chính

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| chrome-remote-interface | 0.34.0 | Giao tiếp Chrome DevTools Protocol |
| axios | 1.15.2 | HTTP requests (proxy, IP lookup) |
| async-lock | 1.4.1 | Đồng bộ truy cập tài nguyên |
| proper-lockfile | 4.1.2 | Lock file ở hệ thống |
| debug | 4.4.3 | Debug logging theo namespace |
| extract-zip | 2.0.1 | Giải nén engine bundle |
| chokidar | ^5.0.0 | Watch file system |
| fast-glob | 3.3.3 | File globbing |
| compare-versions | 6.1.1 | So sánh phiên bản Chromium |

## Testing & Linting

| Công nghệ | Phiên bản |
|---|---|
| Mocha | ~11.3 |
| ESLint | ~10.0 |
| Prettier | ~3.8 |

## Công cụ phát triển

- ESLint + Prettier (format: tabs, single quotes, 100 printWidth, trailingComma all)
- tsx (TypeScript execution)
- dotenv (biến môi trường)
- jiti (TypeScript runtime)
