# Design: Hệ thống kiểu

## Vấn đề

Các tuỳ chọn fingerprint, proxy, profile cần kiểu dữ liệu rõ ràng để TypeScript kiểm tra ở compile time.

## Giải pháp

5 file type trong `src/types/`:
- `PWChromium.ts` — interface public của BrowserEngine
- `fingerprint.ts` — `FingerprintOptions`
- `proxy.ts` — `ProxyOptions`
- `profile.ts` — `ProfileOptions`
- `fetch.ts` — `FetchOptions`, `Tag`, `Time`

Ngoài ra `plugin-options.ts` và `config.ts` cho internal types.

---

Xem thêm: [Spec](../specs/type-system.spec.md) | [Plan](../plans/type-system.plan.md)
