# Known Issues

> Issues này đã được ghi nhận và cần xử lý. Khi fix xong, cập nhật trạng thái tại đây.

<!-- Template cho issue mới (copy-paste bên dưới, điền nội dung):

**#N — Tiêu đề ngắn**
- **File:** ...
- **Vấn đề cũ:** ...
- **Fix:** ...
- **Tài liệu:** [Design](designs/...) | [Spec](specs/...) | [Plan](plans/...) | [Overview](overviews/...)

-->

### OPEN

**#8 — Engine download URL dùng HTTP không an toàn**
- **File:** `src/plugin/connector/engine.ts:367`
- **Vấn đề cũ:** URL metadata fetch dùng `http://bablosoft.com/distr/...` — không có HTTPS, dễ bị MITM tấn công khi tải engine binary xuống máy người dùng.
- **Fix:** Đổi scheme thành `https://`; nếu HTTPS fail thì fallback sang HTTP để tránh blocking.

---

**#9 — `BrowserEngine.launch()` dùng `Error` thô thay vì `PluginError`**
- **File:** `src/adapter/playwright/chromium.ts:136`
- **Vấn đề cũ:** `throw new Error(...)` — vi phạm CONVENTIONS.md yêu cầu dùng `PluginError` cho mọi lỗi engine.
- **Fix:** Đổi thành `throw new PluginError(...)`.

---

**#10 — Import path alias `'src/types/fetch'` không khớp tsconfig**
- **File:** `src/adapter/playwright/chromium.ts:23`
- **Vấn đề cũ:** Import `from 'src/types/fetch'` — tsconfig.json chỉ define alias `@src/*`, không define `src/*`. Có thể không resolve được ở một số môi trường (ts-node, jiti...).
- **Fix:** Đổi thành relative path `from '../../types/fetch'` hoặc align alias thành `@src/*` nếu muốn dùng absolute import.

---

**#11 — `defaultLauncher` mutable state gây khó unit test**
- **File:** `src/adapter/playwright/engine.ts:29-33`
- **Vấn đề cũ:** `defaultLauncher` là object khởi tạo ở module scope — là global mutable state. Khi test với launcher mock, state này ảnh hưởng đến các test khác trong cùng process.
- **Fix:** Chuyển thành getter hoặc factory function, cho phép inject launcher trong constructor (không dùng default).

---

### FIXED

**#1 — `notify()` dead code**
- **File:** `src/plugin/connector/utils.ts`, `src/plugin/connector/index.ts`
- **Vấn đề cũ:** `notify()` được định nghĩa và export nhưng không có file nào import. `notifyTimer` được khai báo, `clearTimeout(notifyTimer)` có trong `finally`, nhưng `notifyTimer` không bao giờ được gán giá trị.
- **Fix:** Import `notify()` vào `connector/index.ts` và gọi trong `api()` khi engine trả lỗi "key is missing". Sửa kiểu `notifyTimer` cho tương thích.
- **Tài liệu:** [Design](designs/bug-001-notify-dead-code.design.md) | [Spec](specs/bug-001-notify-dead-code.spec.md) | [Plan](plans/bug-001-notify-dead-code.plan.md) | [Overview](overviews/bug-001-notify-dead-code.overview.md)

---

**#2 — Error classes không export trong public API**
- **File:** `src/index.ts`
- **Vấn đề cũ:** `PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError` (trong `src/plugin/errors.ts`) không được re-export ra public API.
- **Fix:** Thêm export block 5 error class từ `./plugin/errors` vào `src/index.ts`.
- **Tài liệu:** [Design](designs/bug-002-export-error-classes.design.md) | [Spec](specs/bug-002-export-error-classes.spec.md) | [Plan](plans/bug-002-export-error-classes.plan.md) | [Overview](overviews/bug-002-export-error-classes.overview.md)

---

**#3 — `quit()` xoá toàn bộ `BROWSER_RUNNING_DIR` thay vì chỉ xoá temp dir của instance**
- **File:** `src/adapter/playwright/chromium.ts:quit()`
- **Vấn đề cũ:** `this.dataManager.unmap(BROWSER_RUNNING_DIR)` xoá cả thư mục gốc `.tmp/browser/running/`, không chỉ temp dir của instance hiện tại.
- **Fix:** Đổi `this.dataManager.unmap(BROWSER_RUNNING_DIR)` thành `this.dataManager.dispose()` — chỉ xoá `instanceTempDir` của instance hiện tại.
- **Tài liệu:** [Design](designs/bug-003-quit-unmap-root.design.md) | [Spec](specs/bug-003-quit-unmap-root.spec.md) | [Plan](plans/bug-003-quit-unmap-root.plan.md) | [Overview](overviews/bug-003-quit-unmap-root.overview.md)

---

**#4 — JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại**
- **File:** `src/types/PWChromium.ts:17,25`
- **Vấn đề cũ:** JSDoc example gọi `usePrivateKey()` — method không tồn tại trong interface.
- **Fix:** Xoá tham chiếu `usePrivateKey()`, thay bằng hướng dẫn set biến môi trường `BABLOSOFT_KEY`.
- **Tài liệu:** [Design](designs/bug-004-jsdoc-privatekey.design.md) | [Spec](specs/bug-004-jsdoc-privatekey.spec.md) | [Plan](plans/bug-004-jsdoc-privatekey.plan.md) | [Overview](overviews/bug-004-jsdoc-privatekey.overview.md)

---

**#5 — `npm run clean` không tương thích Windows**
- **File:** `package.json`
- **Vấn đề cũ:** Dùng `rm -rf` không chạy được trên Windows.
- **Fix:** Chuyển sang `tsup --clean` (built-in, cross-platform).

---

**#6 — Mutex path resolution sai sau khi tsup bundle**
- **File:** `src/plugin/mutex/index.ts`
- **Vấn đề cũ:** Hardcoded `../../../` trong path resolve bị sai sau khi tsup bundle.
- **Fix:** Walk-up algorithm tìm package root (`resolvePackageRoot`).
- **Tài liệu:** [Design](designs/mutex-path-resolution.design.md) | [Spec](specs/mutex-path-resolution.spec.md) | [Plan](plans/mutex-path-resolution.plan.md) | [Overview](overviews/mutex-path-resolution.overview.md)

---

**#7 — Singleton `Chromium` không hỗ trợ launch nhiều profile song song**
- **File:** `src/adapter/playwright/chromium.ts`, `tests/multi_context.ts`
- **Vấn đề cũ:** `BrowserEngine` là singleton — `launch()` chỉ cho phép gọi một lần. Test `multi_context.ts` gọi launch cho 2 profile khác nhau trên cùng instance, lỗi `"Phuong thuc launch() chi duoc goi mot lan."`.
- **Fix:** Xoá singleton `Chromium`, export class `BrowserEngine` trực tiếp. Mỗi `new BrowserEngine()` là instance độc lập, có thể launch riêng. Giữ alias `Chromium = BrowserEngine` cho backward compatibility.
- **Tài liệu:** [Design](designs/bug-007-multi-profile-singleton.design.md) | [Spec](specs/bug-007-multi-profile-singleton.spec.md) | [Plan](plans/bug-007-multi-profile-singleton.plan.md) | [Overview](overviews/bug-007-multi-profile-singleton.overview.md)
