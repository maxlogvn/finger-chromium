# Overview: Hook Binding

## Mục tiêu

Intercept Playwright methods (newContext, newPage, setViewportSize) để tự động resize viewport và chặn thay đổi sau fingerprint.

## Kết quả

- `src/adapter/playwright/utils.ts` (phần hook binding): `onClose()`, `bindHooks()`, `resetOptions()`, `isBrowser()`.
- Tích hợp vào `PlaywrightFingerprintPlugin.configure()`.

## Kiểm tra

- `npm run lint` -- 0 errors (1 pre-existing warning `no-explicit-any` tại utils.ts:70).

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### Proxy chain phụ thuộc vào Playwright internal API

`bindHooks()` dùng Proxy intercept `Browser.newContext()`, `BrowserContext.newPage()`, `Page.setViewportSize()`. Nếu Playwright thay đổi signature (thêm tham số, đổi tên), proxy chain fail âm thầm. Không có compile-time check -- chỉ phát hiện khi runtime test.

### `isBrowser()` không phải type guard hoàn hảo

Kiểm tra `'version' in target && typeof target.version === 'function'`. Trong thực tế Playwright API, chỉ `Browser` class mới có method `version()`. Object custom có property `version` function sẽ bị nhầm.

### `setViewportSize` bị block hoàn toàn

`patchPage()` proxy `setViewportSize` với implementation chỉ in `console.warn`. Không throw error -- user không biết viewport đã bị lock trừ khi mở console.

### `resetOptions()` ép viewport null

```ts
function resetOptions<T>(options: T): T & { viewport: null } {
  return { ...(options ?? {}), viewport: null };
}
```

Nếu user truyền `viewport: { width: 1920, height: 1080 }`, nó bị override thành `null` silently.

### Fallback khi target là BrowserContext

Nếu `target` truyền vào `bindHooks()` đã là BrowserContext (không qua `Browser.newContext`), `patchContext()` được gọi trực tiếp. Trường hợp này xảy ra khi `PlaywrightFingerprintPlugin.configure()` nhận context từ `launchPersistentContext()`.

---
