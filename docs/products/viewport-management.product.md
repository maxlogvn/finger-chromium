# Product: Quản lý Viewport

## Tổng quan

Resize browser viewport theo fingerprint và đồng bộ thông số vào engine config. Tự động điều chỉnh nếu lần resize đầu chưa chính xác.

## CDP-based resize

Dùng Chrome DevTools Protocol thay vì Playwright API để resize. Lý do: CDP có thể resize trước khi page được tạo.

```ts
// Tự động resize khi tạo page mới
// Viewport luôn đúng kích thước fingerprint
```

## Delta correction

Khi resize, window chrome (title bar, border) chiếm khoảng 16x88 pixels trên Windows. Hệ thống tự động tính delta và retry tối đa 3 lần nếu kết quả chưa đúng.

## BAS_NOT_SET sentinel

Engine dùng giá trị `-170141183460469231731687303715884105727` (`BAS_NOT_SET`) để reset cached availWidth/availHeight, buộc engine đọc lại giá trị thật từ system.
