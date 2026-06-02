# Design: Playwright Bridge

## Vấn đề

FingerprintPlugin spawn worker.exe thuần, không tích hợp Playwright. Cần bridge để dùng Playwright BrowserContext.

## Giải pháp

`PlaywrightFingerprintPlugin extends FingerprintPlugin`:
- Override `launch` → fallback sang `launchPersistentContext`
- Override `launchPersistentContext` → inject fingerprint qua `_launch(false, ...)`
- Filter `--user-data-dir` argument tránh xung đột
- Validate unsupported options: proxy, channel, firefoxUserPrefs

---

Xem thêm: [Spec](../specs/playwright-bridge.spec.md) | [Plan](../plans/playwright-bridge.plan.md)
