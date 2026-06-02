# Design: Browser Launcher

## Vấn đề

Cần spawn Chromium từ engine binary và phát hiện DevTools listening URL từ stdout/stderr.

## Giải pháp

`BrowserLauncher`:
- `spawn(path, args?, options?)`: spawn child process
- `configure(browser)`: pipe, timeout, env
- `close(browser, pid?)`: kill process
- Phát hiện DevTools URL qua regex `DevTools listening on (ws://[^\s]+)`

## Interface `Browser`

```ts
interface Browser {
  pid: number;
  wsEndpoints: string[];
  process: ChildProcess;
  configure(): void;
  close(): void;
}
```

---

Xem thêm: [Spec](../specs/browser-launcher.spec.md) | [Plan](../plans/browser-launcher.plan.md)
