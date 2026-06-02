# Spec: Quản lý Viewport

## Mô tả

Resize viewport browser và đồng bộ thông số vào engine config.

## CDP Resize

Method `setViewport(browser, {width, height})`:
- Kết nối CDP qua `chrome-remote-interface`
- `Browser.getWindowForTarget` → lấy windowId
- `Browser.setWindowBounds` → resize
- Retry tối đa 3 lần, delta correction

## Sync .ini

`synchronize(id, pwd, bounds, action)`:
- Đọc file `.ini` của engine
- Reset `availWidth/availHeight` → `BAS_NOT_SET`
- Chạy action (resize)
- Set giá trị thật → `.ini`

---

Xem thêm: [Design](../designs/viewport-management.design.md) | [Plan](../plans/viewport-management.plan.md)
