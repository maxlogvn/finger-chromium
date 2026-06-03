# Product: Quản lý Viewport

## Mô tả

Tính năng tự động đặt kích thước viewport cho browser dựa trên fingerprint. Dùng CDP (Chrome DevTools Protocol) để resize với cơ chế retry (tối đa 3 lần) và delta correction để đảm bảo độ chính xác đến từng pixel.

Sau khi viewport đã set, `page.setViewportSize()` bị chặn — tránh thay đổi viewport làm fingerprint lệch.

## Cách sử dụng

Viewport tự động set khi gọi `launch()` và `newContext()` — không cần cấu hình thủ công:

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();
const fingerprintData = await engine.newFingerprint();

const context = await engine
  .useFingerprint(fingerprintData)
  .launch()
  .newContext();
// Viewport tự động resize theo fingerprint
```

Nếu không có fingerprint, dùng kích thước từ `defaultViewport` option:

```ts
const context = await engine
  .launch({ viewport: { width: 1920, height: 1080 } })
  .newContext();
```

## Hành vi chi tiết

- Resize qua CDP: kết nối CDP session, lấy windowId, gọi `Browser.setWindowBounds`, chờ resize hoàn tất qua `waitForResize` script, kiểm tra lại kích thước.
- Delta correction: nếu viewport sai lệch (do khung viền, DPI scaling), tự động tính delta và thử lại với kích thước đã điều chỉnh.
- Retry tối đa 3 lần. Nếu vẫn không chính xác, ghi warning và tiếp tục — không block user.
- `setViewportSize()` của Page bị chặn qua proxy — in warning thay vì throw.
- `availWidth`/`availHeight` được đồng bộ vào `.ini` file của engine để fingerprint service biết kích thước màn hình thật.

## Giới hạn và điều kiện

- Yêu cầu CDP port accessible (engine mở CDP tự động).
- Resize chính xác phụ thuộc vào DPI scaling và loại màn hình.
- Nếu không thể đặt viewport chính xác sau 3 lần, chấp nhận sai số (cảnh báo console).
- Chỉ hỗ trợ Windows.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/viewport-management.spec.md`
- Design: `docs/designs/viewport-management.design.md`
- Source: `src/adapter/playwright/utils.ts`, `src/plugin/browser.ts`
