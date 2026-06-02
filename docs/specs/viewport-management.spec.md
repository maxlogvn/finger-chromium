# Spec: Quản lý Viewport

## CDP-based setViewport (`plugin/browser.ts`)

### Function: setViewport

```ts
export async function setViewport(browser: Browser, bounds: {
  width: number;
  height: number;
  diff?: { width: number; height: number };
}): Promise<void>
```

Params:
- `browser`: Browser instance (từ launcher)
- `bounds.width/height`: Viewport mong muốn
- `bounds.diff`: Delta offset (mặc định 16x88)

Flow:
```
1. const cdp = await CDP({ host: '127.0.0.1', port: browser.port })
2. const { windowId } = await cdp.Browser.getWindowForTarget()
3. Loop MAX_RESIZE_RETRIES (3):
   a. bounds = { width: desiredW + deltaW, height: desiredH + deltaH }
   b. await Promise.all([
        cdp.Browser.setWindowBounds({ windowId, bounds }),
        waitForResize(cdp)   // Runtime.evaluate scripts.waitForResize
      ])
   c. actual = await getViewport(cdp)  // Runtime.evaluate scripts.getViewport
   d. If match → break
   e. Else: delta += desired - actual (auto-correction)
4. cdp.close()
```

### Function: synchronize (`plugin/config.ts`)

```ts
export async function synchronize(
  id: string,
  pwd: string,
  bounds: { width: number; height: number },
  action: () => Promise<void>
): Promise<void>
```

Flow:
```
1. const lock = new AsyncLock()
2. lock.acquire(id, async () => {
3.   // Phase 1: reset
     write ini: availWidth = -170141183460469231731687303715884105727 (BAS_NOT_SET)
     write ini: availHeight = BAS_NOT_SET
     await delay(2000)
     // Phase 2: set real values after action
     await action()
     write ini: availWidth = bounds.width
     write ini: availHeight = bounds.height
     await delay(2000)
   })
```
