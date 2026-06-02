# Overview: Common Scripts

File: `src/common/index.ts` (25 dòng).

## Lưu ý kỹ thuật

- Scripts được serialized qua `toString()` và gửi xuống browser context. Closure variables không được capture -- mọi thứ phải nằm trong function body. Đây là hạn chế của `page.evaluate()`: chỉ chấp nhận function + serializable args.
- `waitForResize` dùng ResizeObserver trên `document.body`. Nếu `document.body` null (trang chưa load hoặc trang không có body), script sẽ crash. Chỉ gọi scripts sau khi `DOMContentLoaded` hoặc `page.goto()`.
- `getViewport` dùng `window.innerWidth/Height` thay vì `document.documentElement.clientWidth/Height`. `innerWidth` bao gồm scrollbar, `clientWidth` không. Fingerprint service dùng `innerWidth` nên cần đồng bộ.
- Double rAF: lần 1 đảm bảo layout đã tính toán, lần 2 đảm bảo paint đã render. Nếu chỉ dùng 1 rAF, đôi khi giá trị innerWidth/Height chưa cập nhật.
- `waitForResize` không có timeout -- nếu ResizeObserver không fire (ví dụ resize không thay đổi kích thước body), Promise sẽ treo vô hạn. Caller nên wrapper với timeout riêng.
- Script dùng trong `page.evaluate()` (adapter/utils.ts) và CDP `Runtime.evaluate` (plugin/browser.ts) -- format stringified function giống nhau, nhưng CDP cần `awaitPromise: true`.
