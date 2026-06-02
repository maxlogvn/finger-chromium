# Design: Playwright Module Loader

## Vấn đề

Playwright là peer dependency -- user có thể cài `playwright` (bản đầy đủ) hoặc `playwright-core` (nhẹ hơn). Cần một cơ chế linh hoạt để resolve package nào có sẵn, kiểm tra version >= minimum, và trả về đúng property (ví dụ `chromium`).

Ngoài ra, source code là ESM (`import`/`export`) nhưng playwright là CJS package -- cần `createRequire` để require.

## Giải pháp: Loader class

### 3-layer resolution

```
Loader.import([target, ...fallbacks])
  -> thử require(target) -> nếu fail -> thử require(fallback[0]) -> ...

Loader.load(property = 'chromium')
  -> gọi Loader.import() với [target, ...packages]
  -> validate version với compare-versions
  -> trả về module[property] || module
```

### Tại sao dùng property fallback?

Playwright export dạng `{ chromium, firefox, webkit }` -> cần `module.chromium`. Nếu module không có property (ví dụ custom launcher), fallback về chính module đó.

### Tại sao dùng createRequire?

File là ESM (import/export). `require` không có sẵn trong ESM. `createRequire` từ `node:module` tạo require function tương thích với CJS packages.

### Version validation

Dùng `compare-versions` library. Chỉ reject nếu version hiện tại < minimum. Cho phép version >=, kể cả major version mới.

### Playwright loader instance

```ts
// src/adapter/playwright/loader.ts
const loader = new Loader('playwright', '1.27.1', ['playwright-core']);
export default loader;
```

---

Xem thêm: [Spec](../specs/playwright-module-loader.spec.md) | [Plan](../plans/playwright-module-loader.plan.md)
