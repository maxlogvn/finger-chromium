# Spec: Browser Launcher

## Mô tả

Spawm Chromium từ engine binary, phát hiện CDP endpoint.

## API

| Method | Mô tả |
|---|---|
| `spawn(path, args?, options?)` | Create Browser instance |
| `configure(browser)` | Configure timeout, env |
| `close(browser, pid?)` | Kill process |
| `parseDebugUrl(data)` | Extract ws:// từ stdout |

## CDP Detection

Regex: `/DevTools listening on (ws:\/\/[^\s]+)/gi`

Hỗ trợ nhiều target → `wsEndpoints[]`.

---

Xem thêm: [Design](../designs/browser-launcher.design.md) | [Plan](../plans/browser-launcher.plan.md)
