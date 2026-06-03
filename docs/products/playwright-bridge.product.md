# Product: Playwright Bridge

## Mô tả

Playwright Bridge là lớp giúp fingerprint engine làm việc với Playwright. Class chính là `PlaywrightFingerprintPlugin`.

Bridge này không thay thế Playwright. Nó chỉ bọc bước launch để browser được setup fingerprint, proxy và profile trước khi user nhận `BrowserContext`.

## Cách sử dụng

Trong luồng thông thường, user dùng `BrowserEngine` và không cần tạo bridge trực tiếp. Dùng trực tiếp `PlaywrightFingerprintPlugin` khi cần custom launcher hoặc muốn kiểm soát lớp bridge.

```ts
import { PlaywrightFingerprintPlugin } from './src/adapter/playwright/engine';

const plugin = new PlaywrightFingerprintPlugin();

plugin.setServiceKey(process.env.BABLOSOFT_KEY ?? '');
const fingerprintData = await plugin.fetch();
plugin.useFingerprint(fingerprintData);
plugin.useProfile('./profiles/user_01', {
  loadProxy: true,
  loadFingerprint: true,
});

const context = await plugin.launchPersistentContext('./profiles/user_01', {
  viewport: { width: 1280, height: 720 },
});

const page = await context.newPage();
await page.goto('https://example.com');

await plugin.cleanup();
```

## Hành vi chi tiết

`launchPersistentContext()` là method chính. Đây là API Playwright mở browser với thư mục profile cố định. Engine cần kiểu launch này vì fingerprint và profile phải được chuẩn bị trước khi browser trả context cho user.

`launch()` vẫn tồn tại, nhưng chỉ fallback sang `launchPersistentContext()`. Nó in warning để user biết cách dùng khuyến nghị.

Bridge chặn các option sau:

- `proxy`: proxy phải đi qua fingerprint engine để đồng bộ timezone, WebRTC và geolocation.
- `channel`: engine tự quyết định browser executable.
- `firefoxUserPrefs`: flow này chỉ dành cho Chromium.

Bridge cũng xử lý args:

- bỏ `--user-data-dir` khỏi args runtime, vì profile path do engine kiểm soát,
- thêm `--disable-extensions` vào `ignoreDefaultArgs`, vì default arg này có thể làm sai môi trường mà engine cần.

## Viewport và cleanup

Sau khi context mở, `configure()` đăng ký cleanup khi context đóng. Nếu engine trả về bounds, bridge kiểm tra page đầu tiên và resize bằng CDP khi cần.

CDP là Chrome DevTools Protocol, giao thức điều khiển Chromium ở mức thấp hơn API page thông thường. Bridge dùng CDP để đạt kích thước viewport đúng hơn khi fingerprint đã khóa kích thước.

`bindHooks()` đảm bảo page mới cũng đi qua logic resize. Nó cũng chặn `page.setViewportSize()` vì đổi viewport sau khi fingerprint đã set có thể làm fingerprint lệch.

## Giới hạn và điều kiện

- Cần Playwright tối thiểu `1.27.1`.
- `launch()` không phải launch thuần. Nên dùng `launchPersistentContext()` trực tiếp.
- Bridge chỉ hỗ trợ Chromium flow.
- Nếu dùng launcher custom, launcher phải có `launchPersistentContext()`.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/playwright-bridge.spec.md`
- Design: `docs/designs/playwright-bridge.design.md`
- Source: `src/adapter/playwright/engine.ts`
