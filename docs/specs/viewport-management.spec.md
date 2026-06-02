# Spec: Quản lý Viewport

## 3 files: `plugin/browser.ts`, `plugin/config.ts`, `adapter/playwright/utils.ts`

---

## CDP setViewport (`plugin/browser.ts`)

### Function `setViewport(browser, { diff, width, height })`

```ts
export const setViewport = async (
  browser: Browser,
  { diff, width, height }: SetViewportOptions
): Promise<void>
```

Flow:

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `const cdp = await connect(browser)` | Kết nối CDP qua chrome-remote-interface |
| 2 | `const { windowId } = await cdp.Browser.getWindowForTarget()` | Lấy window handle |
| 3 | `delta = diff ?? { width: 16, height: 88 }` | Delta mặc định (window chrome) |
| 4 | Loop `i < MAX_RESIZE_RETRIES (3)` | Retry tối đa 3 lần |
| 4a | `bounds = { width: desiredW + deltaW, height: desiredH + deltaH }` | Tính bounds |
| 4b | `await Promise.all([cdp.Browser.setWindowBounds({ bounds, windowId }), waitForResize(cdp)])` | Set bounds + chờ resize |
| 4c | `viewport = await getViewport(cdp)` | Verify kích thước |
| 4d | Nếu match -> break | Đúng kích thước |
| 4e | `delta += height - viewport.height` (tương tự width) | Tự điều chỉnh |
| 5 | `await cdp.close()` | Ngắt kết nối CDP |

### Function `getViewport(cdp)`

```ts
const { result } = await cdp.Runtime.evaluate({
  expression: `(${scripts.getViewport})()`,
  returnByValue: true,
});
return result.value;  // { width, height }
```

### Function `waitForResize(cdp)`

```ts
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize})()`,
  returnByValue: true,
  awaitPromise: true,
});
```

---

## CDP setViewport (`adapter/playwright/utils.ts`)

### Function `setViewport(page, { diff, width, height })`

Tương tự `plugin/browser.ts` nhưng khác cách kết nối CDP:

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `const cdp = await page.context().newCDPSession(page)` | Tạo CDP session từ Playwright page |
| 2 | ... | ... giống plugin/browser.ts |
| 9 | `await cdp.detach()` | Ngắt CDP session |

### Function `getViewport(page)`

```ts
page.evaluate(scripts.getViewport)  // { width, height }
```

### Function `waitForResize(page)`

```ts
page.evaluate(scripts.waitForResize)
```

---

## Configure + Synchronize (`plugin/config.ts`)

### Function `configure(cleanup, browser, bounds, sync)`

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `browser.process.once('exit', () => cleanup(browser))` | Cleanup khi process kết thúc |
| 2 | `browser.configure = async () => { if (bounds) await sync(() => setViewport(browser, bounds)) }` | Set configure callback |
| 3 | `await browser.configure()` | Gọi configure ngay |

### Function `synchronize(id, pwd, bounds, action)`

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `configPath = \`${pwd}/s/${id}1.ini\`` | Đường dẫn file .ini |
| 2 | `lock.acquire(id, async () => { ... })` | AsyncLock per instance |
| 3 | Phase 1: đọc file, replace `availWidth`/`availHeight` bằng `BAS_NOT_SET` | Reset |
| 4 | Gọi `action()` | Resize |
| 5 | `await setTimeout(2000)` | Delay 2s |
| 6 | Phase 2: replace `availWidth`/`availHeight` bằng giá trị thật | Set real values |
| 7 | `await setTimeout(2000)` | Delay 2s |

---

## In-browser Scripts (`src/common/index.ts`)

```ts
// waitForResize: ResizeObserver + double requestAnimationFrame
scripts.waitForResize = `
  new Promise(resolve => {
    new ResizeObserver(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      .observe(document.body)
  })
`;

// getViewport: window.innerWidth/innerHeight
scripts.getViewport = `
  () => ({ width: window.innerWidth, height: window.innerHeight })
`;
```

---

## Kiểm tra

- Cần browser thật để test resize -- không thể mock CDP response.
- Verify `availWidth`/`availHeight` trong file .ini sau synchronize.
- Test edge: resize khi fullscreen (window chrome khác).
- Test edge: resize nhiều lần trên cùng instance -- lock không deadlock.

---
