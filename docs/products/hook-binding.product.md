# Product: Hook Binding

## Mô tả

Hook Binding intercept (chặn và can thiệp) các method Playwright để tự động resize viewport và chặn thay đổi kích thước sau khi fingerprint đã set. Khi bạn gọi `context.newPage()`, viewport tự động được resize về kích thước fingerprint — không cần gọi `page.setViewportSize()` thủ công.

## Cách sử dụng

Hook Binding tích hợp sẵn vào `PlaywrightFingerprintPlugin`:

```ts
const context = await Chromium.newContext();
const page = await context.newPage();
// Page tự động resize về kích thước fingerprint
```

Đăng ký cleanup handler:

```ts
import { onClose } from './adapter/playwright/utils';

onClose(browser, () => cleanup());
// Browser: 'disconnected' event
// BrowserContext: 'close' event
```

## Hành vi chi tiết

### Proxy chain

```
Browser.newContext()
  -> force viewport: null (chống Playwright tự resize trước)
  -> patch context

BrowserContext.newPage()
  -> onPageCreated hook -> CDP resize theo fingerprint
  -> patch page

Page.setViewportSize()
  -> bị chặn -> in warning
```

### Chặn setViewportSize

```ts
await page.setViewportSize({ width: 800, height: 600 });
// Warning: "[Fingerprint] Không thể thay đổi viewport:
// kích thước đã bị khoá bởi fingerprint."
```

Không throw error vì throw có thể crash luồng code của user. Warning đủ để user biết.

### Fallback cho launchPersistentContext

Nếu dùng `launchPersistentContext()`, `bindHooks()` nhận `BrowserContext` trực tiếp và gọi `patchContext()` ngay, không qua proxy `newContext()`.

### Resize page đầu tiên

`configure()` trong engine.ts resize page đầu tiên (nếu context đã có page) ngay sau khi bind hooks. CDP resize với retries (tối đa 3 lần) và delta correction.

## Giới hạn và điều kiện

- Hook chỉ áp dụng cho Pages mới (tạo sau khi bind hooks). Pages đã tồn tại trước đó không tự động resize.
- `viewport: null` force — nếu user truyền `viewport` trong options, nó bị override silently.
- `patchPage` chỉ warning, không throw — user không biết viewport đã bị lock trừ khi mở console.
- Phụ thuộc Playwright internal API. Nếu Playwright thay đổi method signature, proxy chain fail âm thầm.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/hook-binding.spec.md`
- Design: `docs/designs/hook-binding.design.md`
- Source: `src/adapter/playwright/utils.ts`
