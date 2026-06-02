# Known Issues

> Issues này đã được ghi nhận và cần xử lý. Khi fix xong, cập nhật trạng thái tại đây.

### OPEN — cần fix

**#1 — `notify()` dead code**
- **File:** `src/plugin/connector/utils.ts`, `src/plugin/connector/index.ts`
- **Vấn đề:** `notify()` được định nghĩa và export nhưng không có file nào import. `notifyTimer` được khai báo, `clearTimeout(notifyTimer)` có trong `finally`, nhưng `notifyTimer` không bao giờ được gán giá trị.
- **Tác động:** Code thừa, gây confusion khi đọc.

---

**#2 — Error classes không export trong public API**
- **File:** `src/index.ts`
- **Vấn đề:** `PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError` (trong `src/plugin/errors.ts`) không được re-export ra public API.
- **Tác động:** Người dùng không thể `import { PluginError } from 'fingerprint-chromium-engine'` để catch lỗi đúng type.

---

**#3 — `quit()` xoá toàn bộ `BROWSER_RUNNING_DIR` thay vì chỉ xoá temp dir của instance**
- **File:** `src/adapter/playwright/chromium.ts:quit()`
- **Vấn đề:** `this.dataManager.unmap(BROWSER_RUNNING_DIR)` xoá cả thư mục gốc `.tmp/browser/running/`, không chỉ temp dir của instance hiện tại.
- **Tác động:** Nếu có nhiều instance đang chạy song song, instance khác bị ảnh hưởng khi một instance gọi `quit()`.

> **Lưu ý:** Task [`quit-handle-cleanup`](plans/quit-handle-cleanup.plan.md) **không** xử lý issue này — cần tạo task riêng để fix.

---

**#4 — JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại**
- **File:** `src/types/PWChromium.ts:17,25`
- **Vấn đề:** JSDoc example gọi `usePrivateKey()` — method này không tồn tại trong interface. Method thật là `setServiceKey(key)` trong `FingerprintPlugin`.
- **Tác động:** Developer đọc JSDoc bị mislead.

---

### FIXED

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
