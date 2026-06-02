# Overview: Quản lý Viewport

## Tóm tắt

Đã triển khai hai implementation resize viewport qua CDP: plugin path dùng `chrome-remote-interface` và Playwright path dùng `CDPSession`. Cả hai đều có retry 3 lần với delta correction. `bindHooks()` chặn `setViewportSize()` sau khi viewport đã set. `synchronize()` đồng bộ availWidth/availHeight vào file `.ini` của engine.

## Kiến trúc

```
Plugin path (browser.ts)
  |-- connect(browser)               Chrome-remote-interface connect
  |-- Browser.getWindowForTarget()   lấy windowId
  |-- Browser.setWindowBounds()      resize outer bounds
  |-- waitForResize(cdp)             ResizeObserver + RAF
  |-- getViewport(cdp)               Runtime.evaluate -> innerWidth/innerHeight
  |-- delta correction               retry max 3 lần

Playwright path (utils.ts)
  |-- page.context().newCDPSession()  CDPSession
  |-- CDP.send('Browser.setWindowBounds')
  |-- page.evaluate(waitForResize)
  |-- page.evaluate(getViewport)

synchronize (config.ts)
  |-- Phase 1: reset availWidth/availHeight -> BAS_NOT_SET
  |-- delay 2s
  |-- action() -> setViewport()
  |-- Phase 2: set availWidth/availHeight -> giá trị thật
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `setViewport()` (plugin path) | `src/plugin/browser.ts` | 49-69 |
| `getViewport()` (plugin path) | `src/plugin/browser.ts` | 74-88 |
| `waitForResize()` (plugin path) | `src/plugin/browser.ts` | 90-99 |
| `configure()` | `src/plugin/config.ts` | 43-86 |
| `synchronize()` | `src/plugin/config.ts` | 88-130 |
| `setViewport()` (Playwright path) | `src/adapter/playwright/utils.ts` | 80-110 |
| `bindHooks()` | `src/adapter/playwright/utils.ts` | 112-145 |

## Delta correction algorithm

```
delta = { width: 16, height: 88 }   // Chromium chrome delta (Win)
for (i = 0; i < 3; i++):
  bounds = { width: target.width + delta.width, height: target.height + delta.height }
  Browser.setWindowBounds({ bounds, windowId })
  waitForResize()
  viewport = getViewport()
  if (viewport.width === target.width && viewport.height === target.height) break
  // correction
  delta.width += target.width - viewport.width
  delta.height += target.height - viewport.height
```

**Tại sao 16x88**: Chromium window chrome (title bar, borders) trên Windows mặc định. Delta khác nhau theo OS, DPI scaling, theme.

## 2-phase synchronize

```
synchronize(id, pwd, bounds, action):
  lock.acquire(id):
    // Phase 1: reset
    đọc file .ini
    availWidth = 'BAS_NOT_SET', availHeight = 'BAS_NOT_SET'
    ghi file
    action()          // setViewport() -> resize
    setTimeout(2000)  // đợi resize hoàn tất

    // Phase 2: set
    availWidth = bounds.availWidth ?? 'BAS_NOT_SET'
    availHeight = bounds.availHeight ?? 'BAS_NOT_SET'
    ghi file
```

## Quyết định thiết kế

- **Hai implementation không thể dùng chung**: Plugin path dùng `chrome-remote-interface` (connect từ port). Playwright path dùng `CDPSession` từ page. API khác nhau hoàn toàn.
- **Delta correction**: `Browser.setWindowBounds` set outer bounds. `window.innerWidth` là viewport. Cần correction vì DPI scaling, theme, OS khác nhau.
- **2-phase synchronize**: Phase 1 set `BAS_NOT_SET` -> resize -> delay -> Phase 2 set real value. Engine cần biết khi nào resize đang diễn ra để không inject viewport sai.
- **AsyncLock**: Đồng bộ truy cập file `.ini` -- tránh race condition khi multi-instance.
- **Retry 3 lần**: Đủ để correction hội tụ. Sau 3 lần vẫn sai -> warning, không throw -- viewport không chính xác nhưng browser vẫn chạy.

## Edge cases

- `connect(browser)` fail (port sai) -> throw.
- CDP close `cdp.close()` fail -> throw.
- Delta correction vẫn sai sau 3 lần -> `console.warn`, không throw.
- `bounds.width`/`height` undefined -> set `BAS_NOT_SET`.
- File `.ini` không tồn tại -> `readFile` throw.
- DPI scaling (>100%) -> delta cần correction nhiều hơn.

## Lưu ý

- Delta mặc định 16x88 cho Windows. Trên OS khác (chỉ hỗ trợ Win), delta có thể khác.
- `synchronize()` dùng AsyncLock -- tránh race condition file `.ini`.
- `bindHooks()` chặn `setViewportSize()` -- viewport không đổi sau fingerprint.
- Cả hai path đều dùng `waitForResize` script từ `src/common/index.ts`.

## Tài liệu liên quan

- `docs/designs/viewport-management.design.md`
- `docs/specs/viewport-management.spec.md`
- `docs/plans/viewport-management.plan.md`
- `docs/products/viewport-management.product.md`
- `src/plugin/browser.ts`
- `src/plugin/config.ts`
- `src/adapter/playwright/utils.ts`
