# Product: Quản lý Viewport

## Tổng quan

Resize viewport browser theo fingerprint và đồng bộ availWidth/availHeight vào engine.

## Cách hoạt động

1. Browser được spawn với viewport null
2. CDP resize với delta correction (mặc định 16x88 cho khung viền)
3. Retry tối đa 3 lần nếu sai lệch
4. Đồng bộ availWidth/availHeight vào file `.ini` của engine

## CDP-based resize

```ts
await setViewport(page, { width: 1920, height: 1080 });
// Tự động tính delta, retry nếu chưa đúng
```
