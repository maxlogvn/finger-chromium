# Overview: Playwright Bridge

## Mục tiêu

Tạo bridge giữa `FingerprintPlugin` và Playwright, cho phép launch persistent context với fingerprint/proxy/profile.

## Kết quả

- `src/adapter/playwright/engine.ts`: 111 dòng, class `PlaywrightFingerprintPlugin`.
- Extends `FingerprintPlugin`, override `launch()`, `launchPersistentContext()`, `configure()`.
- Private `#validateOptions()` chặn 3 unsupported options.
- `IGNORED_ARGUMENTS = ['--disable-extensions']` loại bỏ khỏi args.
- Custom launcher filter `--user-data-dir` trước khi gọi Playwright.

## Kiểm tra

- `npm run lint` -- 0 errors (4 pre-existing warnings `no-explicit-any` tại dòng 73, 77, 88, 89).

## Sai lệch so với kế hoạch

Không có sai lệch đáng kể.

## Ghi chú kỹ thuật

### `_launch(false, ...)` -- tham số `false` rất quan trọng

```ts
return this._launch(false, { ...options, userDataDir, viewport: null, launcher: { ... } });
```

Tham số `useDefaultLauncher = false` báo cho `FingerprintPlugin._launch()` dùng custom launcher thay vì spawn worker.exe trực tiếp. Nếu truyền `true`, nó sẽ spawn worker.exe và mất hết Playwright functionality.

### `configure()` override -- technical debt về type

```ts
async configure(cleanup: (target: any) => void, browser: any, bounds, sync): Promise<void>
```

`browser` thực chất là `BrowserContext`, không phải `Browser`. Type signature ghi `any` vì parent (`FingerprintPlugin`) kỳ vọng `Browser`. Cần refactor type sau.

### Filter `--user-data-dir` khỏi args

Custom launcher lọc `--user-data-dir` khỏi args vì engine binary tự quản lý user data dir:

```ts
const filteredArgs = (opts.args ?? []).filter((arg: string) => !arg.startsWith('--user-data-dir'));
```

### `ignoreDefaultArgs` xử lý 2 trường hợp

```ts
ignoreDefaultArgs: Array.isArray(ignoreDefaultArgs)
  ? ignoreDefaultArgs.concat(IGNORED_ARGUMENTS)
  : ignoreDefaultArgs || IGNORED_ARGUMENTS,
```

- Nếu là array: merge với `IGNORED_ARGUMENTS`.
- Nếu là boolean/undefined: set thành `IGNORED_ARGUMENTS`.

### `onClose()` phân biệt Browser vs BrowserContext

`onClose` (từ utils) dùng type guard `isBrowser()` để chọn event:
- `Browser` -> `'disconnected'` event.
- `BrowserContext` -> `'close'` event.

### `bindHooks()` chặn setViewportSize

Sau khi context được tạo, `bindHooks()` proxy `newPage` và chặn `setViewportSize` (chỉ in warning) để đảm bảo viewport luôn đúng với fingerprint.

---
