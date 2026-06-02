# Spec: BrowserEngine

## Mô tả

Fluent API public chính của thư viện. Singleton `Chromium` instance.

## Methods

| Method | Mô tả |
|---|---|
| `repackChromium(launcher)` | Thay launcher |
| `useFingerprint(data, options?)` | Gắn fingerprint |
| `useProxy(data, options?)` | Proxy |
| `useProfile(dirPath, options?)` | Profile |
| `launch(options?)` | Khởi động (1 lần) |
| `newContext(options?)` | Tạo BrowserContext |
| `newFingerprint(options)` | Fingerprint mới |
| `quit(saveDataPath?)` | Dọn dẹp |

## Profile management

- `useProfile` → `AdapterDataManager.map()` (copy → temp dir)
- `quit` → `AdapterDataManager.unmap()` (xoá temp)

---

Xem thêm: [Design](../designs/browser-engine.design.md) | [Plan](../plans/browser-engine.plan.md)
