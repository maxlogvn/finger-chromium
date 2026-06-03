# Known Issues

> Issues này đã được ghi nhận và cần xử lý. Khi fix xong, cập nhật trạng thái tại đây.

### OPEN — cần fix

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

**#1 — `notify()` dead code**
- **File:** `src/plugin/connector/utils.ts`, `src/plugin/connector/index.ts`
- **Vấn đề cũ:** `notify()` được định nghĩa và export nhưng không có file nào import. `notifyTimer` được khai báo, `clearTimeout(notifyTimer)` có trong `finally`, nhưng `notifyTimer` không bao giờ được gán giá trị.
- **Fix:** Import `notify()` vào `connector/index.ts` và gọi trong `api()` khi engine trả lỗi "key is missing". Sửa kiểu `notifyTimer` cho tương thích.
- **Tài liệu:** [Design](designs/bug-001-notify-dead-code.design.md) | [Spec](specs/bug-001-notify-dead-code.spec.md) | [Plan](plans/bug-001-notify-dead-code.plan.md) | [Overview](overviews/bug-001-notify-dead-code.overview.md)

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
