# Product: Common Scripts

## Tổng quan

2 in-browser scripts để hỗ trợ resize viewport.

## Scripts

### waitForResize

```ts
await page.evaluate(scripts.waitForResize);
```
Dùng ResizeObserver + double requestAnimationFrame để đợi layout ổn định.

### getViewport

```ts
const { width, height } = await page.evaluate(scripts.getViewport);
```
Trả về `{ width: window.innerWidth, height: window.innerHeight }`.
