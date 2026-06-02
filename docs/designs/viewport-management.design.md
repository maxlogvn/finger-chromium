# Design: Quản lý Viewport

## Vấn đề

Kích thước viewport là một phần của fingerprint. Khi spawn browser với viewport mặc định, cần resize về đúng kích thước fingerprint. Cần đồng bộ `availWidth`/`availHeight` vào file `.ini` của engine để engine biết kích thước màn hình thật.

## Giải pháp: CDP-based resize + .ini sync

### CDP Resize

Dùng Chrome DevTools Protocol để resize window browser:

1. Kết nối CDP đến browser.
2. Lấy `windowId` qua `Browser.getWindowForTarget()`.
3. Set bounds qua `Browser.setWindowBounds()`.
4. Verify kích thước qua `Runtime.evaluate` (in-browser script).

Có 2 implementation:
- **`plugin/browser.ts`**: connect trực tiếp CDP qua `chrome-remote-interface`, dùng cho standalone mode.
- **`adapter/playwright/utils.ts`**: connect CDP qua `page.context().newCDPSession(page)`, dùng cho Playwright bridge mode.

### Delta Correction Algorithm

```ts
let delta = { width: 16, height: 88 };  // Window chrome: title bar + border
for (let i = 0; i < 3; i++) {
  await setWindowBounds({ width: desired + delta.width, height: desired + delta.height });
  const actual = await getViewport();
  if (match) break;
  delta.width += desired.width - actual.width;   // Tự điều chỉnh cho lần sau
  delta.height += desired.height - actual.height;
}
```

Lý do cần delta: window chrome (title bar, tab bar, bookmark bar, status bar) chiếm khoảng 16x88 pixels trên Windows. `Browser.setWindowBounds` set toàn bộ window, không phải viewport. Cần trừ phần chrome.

### Sync .ini (`plugin/config.ts`)

`synchronize(id, pwd, bounds, action)`:

1. Dùng `AsyncLock` để tránh race condition giữa các instance.
2. **Phase 1 (reset)**: ghi `availWidth = BAS_NOT_SET`, `availHeight = BAS_NOT_SET` vào file `.ini`.
3. Gọi `action()` -- thường là resize.
4. **Phase 2**: ghi `availWidth` và `availHeight` thật.
5. Mỗi phase có 2s delay.

`BAS_NOT_SET` (-170141183460469231731687303715884105727) là `int128` min value. Engine binary dùng giá trị này để biết "chưa được set" -- bỏ qua cached values và đọc giá trị thật từ system.

### Configure (`plugin/config.ts`)

`configure(cleanup, browser, bounds, sync)`:
1. Đăng ký cleanup handler qua `browser.process.once('exit')`.
2. Set `browser.configure()` để resize viewport.
3. Gọi `browser.configure()` ngay.

---

Xem thêm: [Spec](../specs/viewport-management.spec.md) | [Plan](../plans/viewport-management.plan.md)
