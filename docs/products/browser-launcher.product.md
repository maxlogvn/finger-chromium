# Product: Browser Launcher

## Tổng quan

Browser Launcher spawn Chromium từ engine binary và phát hiện DevTools URL.

## Cách dùng

```ts
const browser = launcher.spawn('./chrome.exe', [
  '--remote-debugging-port=0',
]);
// Tự động parse DevTools URL từ stdout
console.log(browser.wsEndpoints);
// ['ws://127.0.0.1:12345/devtools/browser/xxx']
```

## Tính năng

- Phát hiện CDP endpoint tự động từ stdout/stderr
- Hỗ trợ nhiều target (multi-tab)
- Timeout configurable
- Clean kill với `close()`
