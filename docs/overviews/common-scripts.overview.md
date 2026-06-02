# Overview: Common Scripts

File: `src/common/index.ts` (25 dòng).

## Lưu ý kỹ thuật

- Scripts được serialized qua `toString()` và gửi xuống browser. Closure variables không được capture -- mọi thứ phải nằm trong function body.
- `waitForResize` dùng ResizeObserver trên `document.body`. Nếu body null (trang chưa load), script sẽ crash. Chỉ gọi sau khi `page.goto()` hoặc `DOMContentLoaded`.
- `getViewport` dùng `window.innerWidth/Height` thay vì `document.documentElement.clientWidth/Height`. `innerWidth` bao gồm scrollbar, `clientWidth` không. Viewport fingerprint dùng `innerWidth`.
