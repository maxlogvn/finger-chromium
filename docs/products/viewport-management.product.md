# Product: Quản lý Viewport

## Tổng quan

Kích thước viewport là một phần của fingerprint. Sau khi launch browser, viewport được resize qua CDP để khớp với fingerprint. Nếu resize chưa chính xác, hệ thống tự động điều chỉnh delta.

## Cách hoạt động

### CDP-based resize

Engine dùng Chrome DevTools Protocol thay vì Playwright API vì CDP resize ở cấp độ window, không phải page context. `page.setViewportSize()` chỉ resize trong page, không ảnh hưởng window thật.

### Delta correction

Window chrome (title bar, border, tab bar) chiếm khoảng 16x88 pixels trên Windows:

```
Lần 1: set 1920x1080 + 16x88 = 1936x1168 -> actual 1904x1060 (sai 16x20)
Lần 2: delta += (1920-1904, 1080-1060) = +16,+20
        delta mới: 32x108
        set 1920x1080 + 32x108 = 1952x1188 -> actual 1920x1080 (đúng)
```

Hệ thống retry tối đa 3 lần, mỗi lần tự điều chỉnh delta.

### BAS_NOT_SET sentinel

Trước khi resize, engine set `availWidth`/`availHeight` trong file `.ini` thành `BAS_NOT_SET` (-170141183460469231731687303715884105727). Điều này buộc engine bỏ qua cached values và đọc lại giá trị thật sau resize.

## Bạn cần biết

- Viewport là **read-only** sau khi set -- `page.setViewportSize()` bị chặn.
- Retry 3 lần, nếu vẫn sai thì dùng kết quả cuối cùng (in warning).
- Resize xảy ra khi tạo page mới (qua `bindHooks`).

---
