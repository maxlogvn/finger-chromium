# Plan: Common Scripts

- [x] Bước 1: Viết `waitForResize` function -- ResizeObserver trên document.body, double requestAnimationFrame
  - ResizeObserver disconnect ngay sau khi observe để tránh memory leak
  - Double rAF: lần 1 cho layout, lần 2 cho paint -- đảm bảo kích thước chính xác
  - Script chạy qua `page.evaluate()` hoặc CDP `Runtime.evaluate` (stringified function)

- [x] Bước 2: Viết `getViewport` function -- return `{ width: window.innerWidth, height: window.innerHeight }`
  - Dùng `innerWidth` thay vì `clientWidth` vì viewport fingerprint dùng inner (bao gồm scrollbar)

- [x] Bước 3: Export scripts object `Record<string, (...args) => unknown>`
  - Scripts được lưu trong object, gọi `.toString()` để serialize
  - Không dùng closure variables -- function phải self-contained để evaluate trong browser context

## Edge cases

- `document.body` có thể null nếu trang chưa load → cần gọi scripts sau khi page đã ready
- `waitForResize` không có timeout -- nếu resize không xảy ra, Promise treo vô hạn
- Scripts chạy trong isolated context -- không thể import external modules
