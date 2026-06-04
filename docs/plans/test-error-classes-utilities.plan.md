# Plan: Test Error classes & Utilities

## Các bước thực hiện

- [ ] Bước 1: Test Error classes — 5 class: PluginError, MissingKeyError, InvalidEngineError, EngineTimeoutError, RequestTimeoutError
    - Làm gì: Viết describe('Error classes') với test cho instanceof chain, name, constructor.name, Symbol.toStringTag, message prefix (dedent), và không throw khi khởi tạo.
    - File liên quan: `tests/utils.test.ts`, `src/plugin/errors.ts`
    - Ghi chú: Mỗi class là một describe con. MissingKeyError message chứa "bạn cần chỉ định key", InvalidEngineError chứa "Xóa hoàn toàn thư mục", EngineTimeoutError chứa "setEngineTimeout", RequestTimeoutError chứa "setRequestTimeout".

- [ ] Bước 2: Test `defaultArgs()`
    - Làm gì: Viết describe('defaultArgs()') — test default (không headless, có --bas-force-visible-window), headless: true (--hide-scrollbars, --mute-audio), extensions (--load-extension), IGNORED_ARGS bị lọc (--kiosk, --headless, --user-data-dir, --start-maximized, --start-fullscreen), args rỗng vẫn có --user-data-dir.
    - File liên quan: `tests/utils.test.ts`, `src/plugin/utils.ts`

- [ ] Bước 3: Test `getProfilePath()`
    - Làm gì: Viết describe('getProfilePath()') — ưu tiên userDataDir > --user-data-dir trong args > fallback rỗng.
    - File liên quan: `tests/utils.test.ts`, `src/plugin/utils.ts`

- [ ] Bước 4: Test `validateConfig()` và `validateLauncher()`
    - Làm gì: Viết describe('validateConfig()') — không throw với value string + options object, throw PluginError với value không string hoặc options null. Viết describe('validateLauncher()') — không throw với object có launch function, throw với null/undefined/not object/object thiếu launch.
    - File liên quan: `tests/utils.test.ts`, `src/plugin/utils.ts`

- [ ] Bước 5: Test Common scripts
    - Làm gì: Viết describe('Common scripts') — `scripts.waitForResize` là function, `scripts.getViewport` là function.
    - File liên quan: `tests/utils.test.ts`, `src/common/index.ts`

- [ ] Bước 6: Test Loader class
    - Làm gì: Viết describe('Loader') — constructor lưu target/version/packages, `Loader.import([])` trả về undefined, `Loader.import(['nonexistent-pkg'])` throw PluginError, `load()` với version thấp throw PluginError.
    - File liên quan: `tests/utils.test.ts`, `src/loader/index.ts`
    - Ghi chú: `Loader.import()` dùng `require()` thật — cần mock bằng cách không dùng package nào tồn tại. `load()` cần mock version check — có thể dùng `Loader.import` static method trực tiếp.

- [ ] Bước 7: Chạy kiểm tra
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, `npm test` để xác nhận pass.
    - File liên quan: toàn bộ

## Kiểm tra

Các lệnh cần chạy để xác nhận kết quả sau khi code xong:
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Ghi chú

- `Loader.import()` dùng `require()` thật qua `createRequire` — cần test với package name không tồn tại để kiểm tra throw.
- `common/index.ts` không cần browser thật vì chỉ test typeof function — script chạy trong browser context nên không thể test logic thật trong unit test.
- `dedent` trong error classes không cần test riêng — chỉ test message output có chứa text mong đợi.
