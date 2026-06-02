# Design: Playwright Module Loader

## Vấn đề

Playwright là peer dependency -- user có thể cài `playwright` (bản đầy đủ) hoặc `playwright-core` (nhẹ hơn). Cần một cơ chế linh hoạt để resolve package nào có sẵn, kiểm tra version >= minimum, và trả về đúng property (ví dụ `chromium`).

## Giải pháp: Loader class

### 3-layer resolution

```
Loader.import([target, ...fallbacks])
  → thử require(target) → nếu fail → thử require(fallback[0]) → ...

Loader.load(property = 'chromium')
  → gọi Loader.import()
  → validate version với compare-versions
  → trả về module[property] || module
```

### Tại sao dùng property fallback?

Playwright có 2 dạng export:
- `playwright`: `{ chromium, firefox, webkit }` → cần `module.chromium`
- `playwright-core`: `{ chromium, firefox, webkit }` → cần `module.chromium`

Nếu module không có property (ví dụ custom launcher), fallback về chính module đó.

### Tại sao dùng createRequire?

File này là ESM (import/export). `require` không có sẵn trong ESM. `createRequire` từ `node:module` tạo ra function `require` tương thích với CommonJS packages.

### Version validation

Dùng `compare-versions` library (đã có trong dependencies). Chỉ reject nếu version hiện tại < minimum. Cho phép version >=, kể cả major version mới.

---

Xem thêm: [Spec](../specs/playwright-module-loader.spec.md) | [Plan](../plans/playwright-module-loader.plan.md)
