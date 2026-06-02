# Product: Quản lý Viewport

## Tổng quan

Kích thước viewport là một phần của fingerprint. Sau khi launch browser, viewport được resize qua CDP để khớp với fingerprint. Nếu resize chưa chính xác, hệ thống tự động điều chỉnh.

## Cách hoạt động

### CDP-based resize

Engine dùng Chrome DevTools Protocol thay vì Playwright API vì:
- CDP có thể resize window **trước khi page được tạo**
- Playwright `page.setViewportSize()` chỉ resize trong page context

### Delta correction

Khi resize, window chrome (title bar, border) chiếm khoảng 16x88 pixels trên Windows:

```
Lần 1: set 1920x1080 + 16x88 = 1936x1168 → actual 1904x1060 (sai 16x20)
Lần 2: điều chỉnh delta → actual 1920x1080 (đúng)
```

Hệ thống tự động retry tối đa 3 lần, mỗi lần tính delta correction.

### BAS_NOT_SET sentinel

Trước khi resize, engine set `availWidth` và `availHeight` trong file `.ini` thành giá trị `BAS_NOT_SET` (`-170141183460469231731687303715884105727`). Điều này buộc engine bỏ qua cached values và đọc lại giá trị thật sau resize.

## Bạn cần biết

- Viewport là **read-only** sau khi set -- `page.setViewportSize()` bị chặn
- Retry 3 lần, nếu vẫn sai thì dùng kết quả cuối cùng
- Chỉ resize khi tạo page mới, không ảnh hưởng page đã tồn tại
