# Design: BrowserEngine -- Fluent API

## Vấn đề

Người dùng cần API đơn giản, fluent, không cần biết nội bộ có FingerprintPlugin hay AdapterDataManager.

## Giải pháp

Class `BrowserEngine` implements `PWChromium`:
- Singleton `Chromium` instance được export
- `useFingerprint.useProxy.useProfile.launch.newContext.quit`
- `AdapterDataManager` tự động map/unmap profile để tránh corrupt

---

Xem thêm: [Spec](../specs/browser-engine.spec.md) | [Plan](../plans/browser-engine.plan.md)
