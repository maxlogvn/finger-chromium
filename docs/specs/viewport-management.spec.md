# Spec: Quản lý Viewport

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Tính năng tự động đặt kích thước viewport cho browser dựa trên fingerprint data. Có hai implementation path: một dùng `chrome-remote-interface` (cho plugin path — spawn worker trực tiếp) và một dùng Playwright `CDPSession` (cho Playwright bridge). Cả hai đều dùng retry tối đa 3 lần với delta correction để đạt kích thước chính xác.

Sau khi viewport set, `page.setViewportSize()` bị chặn — tránh thay đổi viewport làm fingerprint lệch.

Source: `src/plugin/browser.ts` (76 dòng), `src/plugin/config.ts` (91 dòng), `src/adapter/playwright/utils.ts` (114 dòng).

## Yêu cầu

- Resize viewport đến kích thước từ fingerprint data.
- Retry tối đa 3 lần với delta correction (tự điều chỉnh nếu sai lệch do window chrome, DPI scaling).
- Hỗ trợ cả 2 path: plugin (chrome-remote-interface) và Playwright bridge (CDPSession).
- Đồng bộ `availWidth`/`availHeight` vào file `.ini` của engine — fingerprint service dùng giá trị này.
- Chặn `page.setViewportSize()` sau khi viewport đã set.

## Thiết kế

### Viewport resize flow

```
Plugin path (browser.ts):
  setViewport(browser, { width, height })
    ├─ chrome-remote-interface.connect(browser)
    ├─ Browser.getWindowForTarget() → windowId
    ├─ Loop 3 lần:
    │    ├─ bounds = desired + delta
    │    ├─ Browser.setWindowBounds() + waitForResize()
    │    ├─ getViewport() verify
    │    ├─ match → break
    │    └─ không match → adjust delta
    └─ cdp.close()

Playwright bridge path (utils.ts):
  setViewport(page, { width, height })
    ├─ CDPSession = page.context().newCDPSession(page)
    ├─ Browser.getWindowForTarget() → windowId
    ├─ Loop 3 lần (giống trên)
    └─ cdp.detach()
```

### synchronize() flow

```
synchronize(id, pwd, bounds, action)
  │
  ├─ Đọc file: pwd/s/{id}1.ini
  │
  ├─ [Round 1]: Set availWidth = "BAS_NOT_SET" (reset)
  │    → action() chạy (resize viewport)
  │    → Wait 2s
  │
  └─ [Round 2]: Set availWidth = bounds.width, availHeight = bounds.height
       → Wait 2s
```

Tại sao reset trước khi set? Engine cần thấy giá trị "not set" để biết viewport đang được thay đổi. Nếu set thẳng giá trị mới, engine có thể ignore.

### Delta correction

```
Delta ban đầu: { width: 16, height: 88 } (window chrome)

Vòng 1:
  bounds = { width: 1280 + 16, height: 720 + 88 }
  setWindowBounds → đo viewport thực tế → { width: 1275, height: 715 }

Vòng 2:
  delta.height += 720 - 715 = 5
  delta.width += 1280 - 1275 = 5
  bounds = { width: 1280 + 21, height: 720 + 93 }
  → đo lại → match → break
```

Tham chiếu design doc: `docs/designs/viewport-management.design.md`.

## API / Data flow

```ts
// Plugin path
import { setViewport } from '../plugin/browser';
await setViewport(browser, { width: 1280, height: 720 });

// Playwright bridge path
import { setViewport } from '../adapter/playwright/utils';
await setViewport(page, { width: 1280, height: 720 });
```

### Input

- `setViewport(browser | page, { width, height, diff? })`.
- `width`, `height` — desired viewport size.
- `diff` — optional delta override (mặc định 16x88).

### Output

- void. Side effect: window bounds thay đổi.

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/browser.ts` | `setViewport` + `getViewport` qua chrome-remote-interface | 76 |
| `src/plugin/config.ts` | `configure()` + `synchronize()` — .ini sync | 91 |
| `src/adapter/playwright/utils.ts` | `setViewport` qua Playwright CDPSession | 114 |
| `src/adapter/playwright/engine.ts` | `configure()` gọi setViewport + bindHooks | 100 |
| `src/common/index.ts` | `waitForResize` + `getViewport` in-browser scripts | 23 |

## Constants

| Tên | Giá trị | Vai trò |
|---|---|---|
| `MAX_RESIZE_RETRIES` | `3` | Số lần retry tối đa |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| CDP kết nối thất bại | Throw error từ `connect()` hoặc `newCDPSession()` |
| `Browser.getWindowForTarget` fail | Throw error — không thể lấy window handle |
| Sau 3 lần retry vẫn lệch | `console.warn`, không throw — chấp nhận sai số |
| `.ini` file không tồn tại | `synchronize()` throw từ `readFile` |
| `synchronize()` — lock không acquire được | AsyncLock xếp hàng — đợi lock release |

## Kiểm tra

- Happy path: viewport được set chính xác sau 1-2 lần retry.
- Edge case: DPI scaling 125%, 150% — delta tự điều chỉnh.
- Edge case: cùng kích thước với viewport hiện tại — 1 lần retry là đủ.
- Error: CDP timeout → throw.
- synchronize: `.ini` file được cập nhật availWidth/availHeight.
- synchronize reset: giá trị "BAS_NOT_SET" trước khi set thật.
