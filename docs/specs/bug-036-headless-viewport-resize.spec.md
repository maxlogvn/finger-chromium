# Spec: Headless viewport resize — fallback CDP sang page.setViewportSize

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`setViewport()` trong `src/adapter/playwright/utils.ts` dùng CDP `Browser.setWindowBounds` để resize viewport — API này không hoạt động trong headless mode vì không có OS window. Fix: nếu CDP thất bại sau retries, fallback sang `page.setViewportSize()` gốc.

## Yêu cầu

- `setViewport()` phải hoạt động đúng cả trong headed lẫn headless mode.
- `page.setViewportSize` vẫn bị proxy để chặn user tự ý thay đổi viewport.
- Không thay đổi public API hay signature của hàm.
- Không ảnh hưởng đến low-level plugin (luôn headed).

## Thiết kế

Tham chiếu: `docs/designs/bug-036-headless-viewport-resize.design.md`

Cơ chế 2 tầng:
1. **Tầng CDP:** thử `Browser.setWindowBounds` với retries/delta adjustment — giống hiện tại.
2. **Tầng fallback:** nếu CDP thất bại (viewport sai sau retries, hoặc CDP session lỗi), gọi `page.setViewportSize()` gốc với delta = 0.

Original `setViewportSize` được lưu vào `WeakMap<Page, Function>` trước khi `bindHooks()` proxy nó.

## Components

| File | Thay đổi |
|------|----------|
| `src/adapter/playwright/utils.ts` | Sửa — thêm `originalSetViewportSize` WeakMap, sửa `patchPage()` để lưu original, sửa `setViewport()` để fallback |
| `src/adapter/playwright/engine.ts` | Không sửa — gọi `setViewport(page, bounds)` như cũ |
| `src/plugin/config.ts` | Không sửa — luôn headed |
| `src/plugin/browser.ts` | Không sửa — luôn headed |

## Xử lý lỗi

| Trường hợp | Xử lý |
|------------|-------|
| CDP session không tạo được (`newCDPSession` throw) | Catch → fallback ngay sang `page.setViewportSize()` |
| CDP `Browser.setWindowBounds` throw | Catch trong vòng lặp → fallback |
| Viewport sai sau 3 retries | Fallback sang `page.setViewportSize()` với delta = 0 |
| Original `setViewportSize` không tìm thấy trong WeakMap | `console.warn` và bỏ qua — không resize |
| Headed mode (bình thường) | CDP hoạt động — không fallback |

## Kiểm tra

| Case | Mô tả |
|------|-------|
| Happy path — headed | CDP setWindowBounds thành công, viewport đúng |
| Happy path — headless | CDP thất bại, fallback sang page.setViewportSize, viewport đúng |
| CDP session lỗi | newCDPSession throw → fallback |
| WeakMap không có original | Warning log, không crash |
| Retry hết vẫn sai | Fallback sau 3 lần retry |
