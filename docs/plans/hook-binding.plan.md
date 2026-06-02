# Plan: Hook Binding

## Các bước thực hiện

- [x] **Bước 1: Implement `isBrowser()` type guard**
  - Kiểm tra `'version' in target && typeof target.version === 'function'`.

- [x] **Bước 2: Implement `onClose()`**
  - Browser -> event `'disconnected'`.
  - BrowserContext -> event `'close'`.

- [x] **Bước 3: Implement `bindHooks()` -- Proxy.newContext + patchContext**
  - Proxy `Browser.newContext()`, force viewport null.

- [x] **Bước 4: Implement `patchContext()`**
  - Proxy `ctx.newPage()`, gọi `hooks.onPageCreated`.
  - Gọi `patchPage()` cho mỗi page.

- [x] **Bước 5: Implement `patchPage()`**
  - Proxy `page.setViewportSize()` -> warning + no-op.

- [x] **Bước 6: Implement `resetOptions()`**
  - Spread `viewport: null` vào options.

- [x] **Bước 7: Tích hợp vào `configure()` trong `engine.ts`**
  - Gọi `bindHooks(context, { onPageCreated: resize })`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/adapter/playwright/utils.ts` | Tất cả hook functions (124 dòng) |
| `src/adapter/playwright/engine.ts` | `configure()` gọi bindHooks |

## Kiểm tra

- `npm run lint` -- 0 errors.

---
