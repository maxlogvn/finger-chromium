# Overview: Common Scripts

## Mục tiêu

Tạo 2 in-browser scripts (`waitForResize`, `getViewport`) hỗ trợ resize viewport.

## Kết quả

- `src/common/index.ts`: 25 dòng, object `scripts` với 2 functions.

## Kiểm tra

- `npm run lint` -- 0 errors.

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### Scripts serialized qua toString()

Scripts được lưu trong object dạng function, gọi `.toString()` để serialize khi dùng với CDP. Closure variables không được capture -- mọi thứ phải nằm trong function body. Đây là hạn chế của `page.evaluate()`.

### `waitForResize` không có timeout

Promise treo vô hạn nếu ResizeObserver không fire (ví dụ resize không thay đổi kích thước body). Caller nên wrapper với timeout riêng.

### Double rAF

Lần 1 đảm bảo layout đã tính toán, lần 2 đảm bảo paint đã render. Nếu chỉ dùng 1 rAF, đôi khi giá trị innerWidth/Height chưa cập nhật.

### `getViewport` dùng `innerWidth`

`window.innerWidth` bao gồm scrollbar, `document.documentElement.clientWidth` không. Fingerprint service dùng `innerWidth` nên cần đồng bộ.

---
