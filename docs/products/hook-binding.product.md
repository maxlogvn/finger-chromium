# Product: Hook Binding

## Tổng quan

Hook Binding intercept Playwright methods để tự động resize viewport và chặn thay đổi kích thước sau khi fingerprint đã set.

## Chi tiết

### Khi bạn gọi `context.newPage()`

```
Browser.newContext()
  -> force viewport: null (chống Playwright tự resize)
  -> patch context

BrowserContext.newPage()
  -> onPageCreated hook -> CDP resize theo fingerprint
  -> patch page

Page.setViewportSize()
  -> bị chặn -> in warning
```

### onClose

```ts
onClose(browser, () => cleanup());
// Browser: 'disconnected' event
// BrowserContext: 'close' event
```

### bindHooks

```ts
bindHooks(context, {
  onPageCreated: async (page) => {
    await setViewport(page, { width: 1920, height: 1080 });
  },
});
```

## Ví dụ

```ts
const context = await Chromium.newContext();
const page = await context.newPage();
// page tự động resize về kích thước fingerprint

// Không thể thay đổi:
await page.setViewportSize({ width: 800, height: 600 });
// Warning: "[Fingerprint] Không thể thay đổi viewport: kích thước đã bị khoá bởi fingerprint."
```

## Lưu ý

- Hook áp dụng cho Pages mới. Ngoài ra, `configure()` trong `engine.ts` cũng resize page đầu tiên (nếu có) ngay sau khi bind hooks.
- `resetOptions()` force `viewport: null` để Playwright không resize trước.
- `patchPage` proxy `setViewportSize` in warning, không throw -- để không crash code.

---
