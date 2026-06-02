# Spec: Common Scripts

## Module: src/common/index.ts (25 dòng)

### Exports

```ts
export const scripts: Record<string, (...args: unknown[]) => unknown>;
```

### waitForResize

```
Type: () => Promise<void>
Mechanism: ResizeObserver on document.body + double requestAnimationFrame
Use case: page.evaluate(scripts.waitForResize) sau khi resize viewport
```

### getViewport

```
Type: () => { width: number; height: number }
Return: { width: window.innerWidth, height: window.innerHeight }
Use case: Xác nhận kích thước sau resize
```

### Usage patterns

```ts
// Playwright page context
await page.evaluate(scripts.waitForResize);
const vp = await page.evaluate(scripts.getViewport);

// CDP Runtime context
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize.toString()})()`,
  awaitPromise: true,
});
```
