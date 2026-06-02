# Product: Hook Binding

## Tổng quan

Hook Binding intercept Playwright methods để tự động resize viewport và chặn thay đổi kích thước sau khi fingerprint đã set.

## Chi tiết

### Khi bạn gọi `context.newPage()`

```
Browser.newContext()
  → force viewport: null (chống Playwright tự resize)
  → patch context

BrowserContext.newPage()
  → onPageCreated hook
  → CDP resize → viewport theo fingerprint
  → patch page

Page.setViewportSize()
  → bị chặn → in warning
```

### onClose

Khi Browser disconnected hoặc BrowserContext closed, cleanup handler được gọi:

```ts
onClose(browser, () => cleanup());
// Browser: 'disconnected' event
// BrowserContext: 'close' event
```

### bindHooks

```ts
bindHooks(browser, {
  onPageCreated: async (page) => {
    await setViewport(page, { width: 1920, height: 1080 });
    console.log('Viewport resized');
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
// Warning: "Khong the thay doi viewport: kich thuoc da bi khoa boi fingerprint"
```

## Lưu ý

- Hook chỉ áp dụng cho Pages mới, không resize page đã tồn tại
- `resetOptions()` force `viewport: null` để Playwright không resize trước -- engine tự resize qua CDP
- `patchPage` proxy `setViewportSize` in warning, không throw -- để không crash code
