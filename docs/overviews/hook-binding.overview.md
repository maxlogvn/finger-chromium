# Overview: Hook Binding

## Tóm tắt

Đã implement proxy chain intercept Playwright methods (`newContext`, `newPage`, `setViewportSize`) để tự động resize viewport và chặn thay đổi sau fingerprint. Tích hợp vào `PlaywrightFingerprintPlugin.configure()`.

## Kiến trúc

```
bindHooks(target)
  |-- isBrowser(target) -> patch Browser.newContext
  |     |-- patchContext(context)
  |           |-- patchPage(page)
  |                 |-- proxy setViewportSize -> console.warn + return
  |     |-- onClose(context) -> register cleanup handler
  |
  |-- setViewport(page, { width, height, diff })
  |     |-- newCDPSession(page) -> CDP Browser.setWindowBounds
  |     |-- delta correction (max 3 retries)
  |
  |-- onClose(emitter, handler) -> register 'close'/'disconnect' event
  |-- resetOptions(options) -> ép viewport: null
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `isBrowser()` type guard | `src/adapter/playwright/utils.ts` | 15-20 |
| `onClose()` | `src/adapter/playwright/utils.ts` | 22-35 |
| `resetOptions()` | `src/adapter/playwright/utils.ts` | 37-42 |
| `patchPage()` | `src/adapter/playwright/utils.ts` | 44-60 |
| `patchContext()` | `src/adapter/playwright/utils.ts` | 62-78 |
| `setViewport()` (Playwright path) | `src/adapter/playwright/utils.ts` | 80-110 |
| `bindHooks()` | `src/adapter/playwright/utils.ts` | 112-145 |

## Flow proxy chain

```
bindHooks(browser)
  |-- isBrowser(browser)? true
  |-- proxy browser.newContext:
        context = await Reflect.apply(original, this, args)
        patchContext(context)
        return context

patchContext(context)
  |-- proxy context.newPage:
        page = await Reflect.apply(original, this, args)
        patchPage(page)
        return page
  |-- onClose(context, cleanup)

patchPage(page)
  |-- proxy page.setViewportSize:
        console.warn('Viewport bị khóa...')
        return Promise.resolve()
  |-- onClose(page, cleanup)
```

## Quyết định thiết kế

- **Dùng Proxy thay vì override method**: Proxy pattern không modify object gốc. Playwright internal có thể thay đổi -- override dễ miss update.
- **`setViewportSize` bị block hoàn toàn**: Sau fingerprint, viewport phải cố định. Thay đổi viewport làm lệch fingerprint (screen size, availWidth/availHeight).
- **`resetOptions()` ép viewport null**: Engine quản lý viewport. Nếu user truyền viewport option, nó bị override thành `null` silently.
- **`isBrowser()` check duck-typing**: Kiểm tra `'version' in target && typeof target.version === 'function'`. Trong Playwright API, chỉ `Browser` class có `version()` method.

## Quyết định thiết kế: delta correction trong setViewport()

`setViewport()` dùng CDP `Browser.setWindowBounds` với delta correction:
```
bounds = { width: target.width + delta.width, height: target.height + delta.height }
-> setWindowBounds -> đo window.innerWidth/innerHeight
-> nếu sai: delta = (target - actual) -> retry (max 3)
```

Tại sao: `setWindowBounds` set outer bounds (cả chrome). `window.innerWidth` là viewport. Delta khác nhau giữa các OS, DPI, theme.

## Rủi ro

- **Proxy chain phụ thuộc vào Playwright internal API**: Nếu Playwright thay đổi signature (thêm tham số, đổi tên), proxy chain fail âm thầm. Không có compile-time check -- chỉ phát hiện khi runtime test.
- **`isBrowser()` không phải type guard hoàn hảo**: Object custom có property `version` function sẽ bị nhầm.
- **`setViewportSize` block silent**: Chỉ in `console.warn`, không throw -- user không biết viewport đã bị lock.
- **`resetOptions()` override silent**: User truyền viewport options bị ghi đè thành `null` -- có thể gây nhầm lẫn.

## Lưu ý

- Fallback: nếu `target` truyền vào `bindHooks()` đã là BrowserContext, `patchContext()` được gọi trực tiếp (không qua proxy). Xảy ra khi `PlaywrightFingerprintPlugin.configure()` nhận context từ `launchPersistentContext()`.
- `setViewport()` có 2 implementation: Playwright path (utils.ts) và plugin path (browser.ts).

## Tài liệu liên quan

- `docs/designs/hook-binding.design.md`
- `docs/specs/hook-binding.spec.md`
- `docs/plans/hook-binding.plan.md`
- `docs/products/hook-binding.product.md`
- `src/adapter/playwright/utils.ts`
