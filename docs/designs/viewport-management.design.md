# Design: Quản lý Viewport

## Vấn đề

Kích thước viewport là một phần của fingerprint. Khi spawn browser với viewport mặc định (hoặc null), cần resize về đúng kích thước fingerprint. Cần đồng bộ `availWidth`/`availHeight` vào engine `.ini` file.

## Giải pháp: CDP-based resize

### CDP Resize (`plugin/browser.ts`)

Dùng `chrome-remote-interface` CDP:
1. Kết nối CDP: `await connect(browser)`
2. Lấy windowId: `await CDP.Browser.getWindowForTarget()`
3. Set bounds: `await CDP.Browser.setWindowBounds({ windowId, bounds })`
4. Verify bằng `Runtime.evaluate` (getViewport script)

### Delta Correction Algorithm

```ts
let deltaWidth = 16;  // Window chrome compensation (Windows)
let deltaHeight = 88;

for (let i = 0; i < MAX_RESIZE_RETRIES; i++) {
  await setWindowBounds({ width: desiredW + deltaWidth, height: desiredH + deltaHeight });
  const viewport = await getViewport(cdp);
  if (viewport.width === desiredW && viewport.height === desiredH) break;
  deltaWidth += desiredW - viewport.width;
  deltaHeight += desiredH - viewport.height;
}
```

Delta correction tự động điều chỉnh nếu lần đầu chưa đúng -- ví dụ window chrome thực tế khác với mặc định.

### Sync .ini (`plugin/config.ts`)

`synchronize(id, pwd, bounds, action)`:
1. Đọc file `<pwd>/s/<id>1.ini`
2. Dùng `AsyncLock` để tránh race condition
3. Phase 1: reset `availWidth = BAS_NOT_SET`, `availHeight = BAS_NOT_SET`
4. Gọi action (resize)
5. Phase 2: set `availWidth` và `availHeight` về giá trị thật
6. Mỗi phase có 2s delay giữa write và check

Tại sao cần BAS_NOT_SET? Khi engine thấy `BAS_NOT_SET`, nó bỏ qua cached values và lấy giá trị thật từ system sau action.

---

Xem thêm: [Spec](../specs/viewport-management.spec.md) | [Plan](../plans/viewport-management.plan.md)
