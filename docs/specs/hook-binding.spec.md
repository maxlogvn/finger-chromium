# Spec: Hook Binding

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Hook Binding intercept các Playwright method (`Browser.newContext`, `BrowserContext.newPage`, `Page.setViewportSize`) để tự động resize viewport theo fingerprint và chặn thay đổi kích thước sau khi đã set.

Giải quyết vấn đề: Playwright tự ý set viewport khi tạo context mới — nếu engine đã resize theo fingerprint data, Playwright set lại làm mất hiệu lực fingerprint viewport.

Source: `src/adapter/playwright/utils.ts` (114 dòng).

## Yêu cầu

1. `Browser.newContext()` phải bị intercept để force `viewport: null` — ngăn Playwright tự resize trước fingerprint.
2. `BrowserContext.newPage()` phải trigger `onPageCreated` hook để resize viewport theo fingerprint.
3. `Page.setViewportSize()` phải bị chặn — in warning, không cho thay đổi viewport sau fingerprint.
4. `onClose()` — đăng ký cleanup handler tự động chạy khi browser disconnected hoặc context close.
5. Hỗ trợ cả `Browser` và `BrowserContext` làm target.
6. `setViewport()` CDP-based resize với retries (tối đa 3 lần) và delta correction.

## Thiết kế

### Proxy chain

```
Browser.newContext()
  → resetOptions() — force viewport: null
  → patchContext()
    → ctx.newPage()
      → onPageCreated hook (resize theo fingerprint)
      → patchPage()
        → page.setViewportSize() — warning + no-op
```

### Type guard

```ts
const isBrowser = (target: unknown): target is Browser =>
  typeof target === 'object' &&
  target !== null &&
  'version' in target &&
  typeof (target as Browser).version === 'function' &&
  'isConnected' in target &&
  typeof (target as Browser).isConnected === 'function' &&
  'contexts' in target &&
  typeof (target as Browser).contexts === 'function';
```

`version`, `isConnected`, `contexts` là 3 method đặc trưng của `Browser` class trong Playwright. Kiểm tra đồng thời cả 3 để giảm false positive khi Playwright thay đổi API.

### setViewport() flow (CDP-based resize)

```
setViewport(page, { width, height })
  │
  ├─ Tạo CDP session: page.context().newCDPSession(page)
  ├─ Lấy window handle: Browser.getWindowForTarget()
  │
  ├─ delta = { width: 16, height: 88 } (window chrome mặc định)
  │
  └─ Loop tối đa 3 lần:
       ├─ bounds = desired + delta
       ├─ Browser.setWindowBounds() + waitForResize() (song song)
       ├─ Verify: getViewport()
       ├─ Nếu match → break
       └─ Nếu không → delta += (desired - actual)
            └─ console.warn nếu lần cuối
  │
  └─ Detach CDP session
```

Delta correction: mỗi lần retry, tính lại delta dựa trên sai lệch thực tế. Vòng 1: window chrome mặc định 16x88. Vòng 2: điều chỉnh nếu sai. Vòng 3: lần cuối, warning nếu vẫn không chính xác.

### Fallback cho launchPersistentContext

Nếu dùng `launchPersistentContext()`, `bindHooks()` nhận `BrowserContext` trực tiếp (vì không có `Browser` instance). Trường hợp này gọi `patchContext()` ngay, không qua proxy `newContext()`.

Tham chiếu design doc: `docs/designs/hook-binding.design.md`.

## API / Data flow

### Input

```ts
bindHooks(target, hooks)
  - target: Browser | BrowserContext
  - hooks: { onPageCreated?: (page: Page) => Promise<void> }

onClose(target, listener)
  - target: Browser | BrowserContext
  - listener: () => void

setViewport(page, { diff?, width?, height? })
  - page: Page
  - diff: optional window chrome delta
  - width, height: desired viewport size

getViewport(page)
  - page: Page
  - returns Promise<{ width, height }>
```

### Output

- `bindHooks`: void. Side effect: proxy methods của target.
- `onClose`: void. Side effect: đăng ký event listener.
- `setViewport`: Promise<void>. Side effect: resize viewport qua CDP.
- `getViewport`: `Promise<{ width: number; height: number }>`.

### Luồng

```
PlaywrightFingerprintPlugin.configure()
  → onClose(context, cleanup)           ─── cleanup khi context close
  → bindHooks(context, { onPageCreated: resizeHandler })
  → resize page đầu tiên nếu có         ─── context đã có page
```

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/adapter/playwright/utils.ts` | `onClose`, `bindHooks`, `setViewport`, `getViewport`, `resetOptions` | 114 |
| `src/adapter/playwright/engine.ts` | `PlaywrightFingerprintPlugin.configure()` gọi bindHooks | — |
| `src/common/index.ts` | `waitForResize` và `getViewport` in-browser scripts | — |

## Constants

| Tên | Giá trị | Vai trò |
|---|---|---|
| `MAX_RESIZE_RETRIES` | `3` | Số lần retry tối đa cho setViewport |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| CDP session không tạo được (`newCDPSession` fail) | Throw error — không thể resize |
| `Browser.getWindowForTarget` fail | Throw error — không thể lấy window handle |
| Resize không match sau 3 lần retry | `console.warn`, không throw — chấp nhận sai số |
| User gọi `page.setViewportSize()` sau fingerprint | `console.warn` — không throw, không crash |
| Target không phải Browser/BrowserContext | Không intercept — hoạt động bình thường |
| Browser đóng đột ngột (disconnected) | Cleanup handler chạy |

## Kiểm tra

- Happy path: `newContext()` → force `viewport: null` → `newPage()` → resize viewport → thành công.
- Block: `page.setViewportSize()` in warning, viewport không đổi.
- Cleanup: `onClose()` chạy khi context close hoặc browser disconnected.
- Retry: resize sai lần 1 → điều chỉnh delta → lần 2 đúng.
- Fallback: launchPersistentContext path → patch context trực tiếp.
- Type guard: `isBrowser` phân biệt đúng Browser vs BrowserContext.
