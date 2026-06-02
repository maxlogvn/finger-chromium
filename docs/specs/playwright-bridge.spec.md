# Spec: Playwright Bridge

## Mô tả

Bridge giữa FingerprintPlugin và Playwright BrowserType.

## Methods

| Method | Mô tả |
|---|---|
| `launch(options)` | Fallback → launchPersistentContext |
| `launchPersistentContext(userDataDir, options)` | Inject fingerprint |
| `configure(cleanup, browser, bounds, sync)` | Resize + bind hooks |

## Validation

Các options không hỗ trợ: `proxy`, `channel`, `firefoxUserPrefs`. Throw error nếu có.

## Ignored arguments

`--disable-extensions` luôn được thêm vào `ignoreDefaultArgs`.

---

Xem thêm: [Design](../designs/playwright-bridge.design.md) | [Plan](../plans/playwright-bridge.plan.md)
