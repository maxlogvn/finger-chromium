# Known Issues

> Issues này đã được ghi nhận và cần xử lý. Khi fix xong, cập nhật trạng thái tại đây.

## Hệ thống theo dõi issue

Dự án dùng hệ thống đồng bộ hai chiều giữa local và GitHub Issues:

### Nguyên lý hoạt động

| Tầng | Công cụ | Mục đích |
|------|---------|----------|
| **Local** | `docs/KNOWN_ISSUES.md` | Entry point duy nhất cho mọi bug và known issue. Dev và AI đọc file này để biết tình trạng hiện tại. |
| **GitHub** | [Issues](https://github.com/maxlogvn/finger-chromium/issues) | Lưu trữ vĩnh viễn, traceable, có thể comment và assign. |

### Mapping giữa local và GitHub

- **OPEN:** 3 issues — xem section OPEN bên dưới
- **FIXED:** 21 issues đã đóng trên GitHub — xem từng entry với số GitHub tương ứng

### Quy trình fix một issue

1. **Chọn issue** từ KNOWN_ISSUES.md (OPEN) hoặc GitHub Issues.
2. **Fix code** theo đúng quy trình WORKFLOW.md.
3. **Cập nhật KNOWN_issues.md**: chuyển từ OPEN sang FIXED, thêm link tài liệu.
4. **Commit code**: commit tất cả thay đổi (code + docs), lấy full commit hash 40 ký tự.
5. **Đồng bộ lên GitHub**: tạo/update GitHub issue, thêm comment chi tiết bằng tiếng Việt có dấu (kèm commit hash ở phần 6).
6. **Đóng GitHub issue** sau khi đã verify fix.

> **Số thứ tự:** Không dùng local numbering. Entry mới đặt ở cuối section FIXED, dùng số GitHub issue duy nhất.

### Quy tắc comment trên GitHub Issues

Mỗi GitHub issue (kể cả đã đóng) phải có một comment duy nhất theo template [`docs/templates/github-closing-comment.template.md`](templates/github-closing-comment.template.md).

### Tạo issue mới

Khi phát hiện bug hoặc vấn đề mới:
1. Tạo GitHub issue mới với nội dung chi tiết.
2. Thêm entry vào KNOWN_ISSUES.md (section OPEN) theo template bên dưới — không dùng local numbering, chỉ ghi số GitHub vào trường `GitHub:`.
3. Khi fix xong, chuyển entry sang section FIXED, thêm link tài liệu và đóng GitHub issue.

### Template cho issue mới

Entry trong KNOWN_ISSUES.md phải theo template [`docs/templates/known-issue.template.md`](templates/known-issue.template.md). Có 2 dạng:

| Loại | Khi nào dùng |
|------|-------------|
| OPEN | Bug đã ghi nhận, chưa sửa |
| FIXED | Bug đã sửa, đã có tài liệu |

> **Ghi chú:** Không dùng local numbering. Mỗi entry chỉ có mô tả + số GitHub issue tương ứng.

### OPEN

**Process không tự động thoát sau khi quit()**
- **File:** `src/plugin/connector/pcapServer/index.ts:61`, `src/plugin/connector/index.ts:142-144`, `src/plugin/index.ts:286-296`
- **Issue:** `net.Server` thiếu `unref()`, không đóng được sau cleanup.
- **GitHub:** [#21](https://github.com/maxlogvn/finger-chromium/issues/21)

**AsyncLock module-level gây contention giữa các instance**
- **File:** `src/plugin/config.ts:34,87`
- **Issue:** `AsyncLock` module-level bị sót sau refactor per-instance.
- **GitHub:** [#22](https://github.com/maxlogvn/finger-chromium/issues/22)

**Race condition khi cleanup: cleaner chạy trước khi engine process thoát hẳn**
- **File:** `src/plugin/index.ts:291`, `src/plugin/connector/index.ts:142-144`, `src/plugin/connector/engine.ts:372-377`
- **Issue:** Kill engine fire-and-forget, cleaner xoá file khi process còn ghi.
- **GitHub:** [#23](https://github.com/maxlogvn/finger-chromium/issues/23)

---

### FIXED

**`isBrowser` type guard dùng string check fragile**
- **File:** `src/adapter/playwright/utils.ts:19-23`
- **Vấn đề:** Phân biệt `Browser` vs `BrowserContext` bằng cách check method `version()` tồn tại. Nếu Playwright thay đổi API, type guard sai.
- **Fix:** Kiểm tra đồng thời 3 method: `version`, `isConnected`, `contexts` — giảm false positive.
- **Tài liệu:** [Design](designs/bug-019-isbrowser-typeguard.design.md) | [Spec](specs/bug-019-isbrowser-typeguard.spec.md) | [Plan](plans/bug-019-isbrowser-typeguard.plan.md) | [Overview](overviews/bug-019-isbrowser-typeguard.overview.md)
- **GitHub:** [#12](https://github.com/maxlogvn/finger-chromium/issues/12) (closed)

---

**Hardcoded `await setTimeout(2000)` bên trong async-lock**
- **File:** `src/plugin/config.ts:83`
- **Vấn đề:** `synchronize()` dùng `await setTimeout(2000)` hai lần bên trong `lock.acquire` — mỗi lần 4 giây chờ vô ích.
- **Fix:**
  1. Thêm tham số `pollInterval?: number` (mặc định 500ms, clamp tối thiểu 100ms).
  2. `await setTimeout(2000)` → `await setTimeout(pollInterval)`.
- **Tài liệu:** [Design](designs/bug-020-setTimeout-async-lock.design.md) | [Spec](specs/bug-020-setTimeout-async-lock.spec.md) | [Plan](plans/bug-020-setTimeout-async-lock.plan.md) | [Overview](overviews/bug-020-setTimeout-async-lock.overview.md)
- **GitHub:** [#13](https://github.com/maxlogvn/finger-chromium/issues/13) (closed)

---

**`RemoteEngine` singleton dùng chung giữa các instance**
- **File:** `src/plugin/connector/index.ts`, `src/plugin/index.ts`
- **Vấn đề:** `RemoteEngine` là singleton global — tất cả `FingerprintPlugin` instance dùng chung một engine process. `kill()` trên một instance giết process của tất cả instance khác.
- **Fix:**
  1. Xoá singleton `engine` khỏi `connector/index.ts`, thay bằng class `Connector` (mỗi instance sở hữu `RemoteEngine` riêng + `AsyncLock` riêng).
  2. `FingerprintPlugin` tạo `#connector` riêng, dùng `this.#connector.api()` thay vì `api()` module-level.
  3. PCAP server giữ nguyên module-level singleton (dùng chung cho cả process).
- **Tài liệu:** [Design](designs/bug-014-remote-engine-factory.design.md) | [Spec](specs/bug-014-remote-engine-factory.spec.md) | [Plan](plans/bug-014-remote-engine-factory.plan.md) | [Overview](overviews/bug-014-remote-engine-factory.overview.md)
- **GitHub:** [#7](https://github.com/maxlogvn/finger-chromium/issues/7) (closed)

---

**PCAP server retry EADDRINUSE nhưng promise gốc không bao giờ resolve**
- **File:** `src/plugin/connector/pcapServer/index.ts`
- **Vấn đề:** Khi port bận, error handler gọi `svr.listen()` lại mà không gắn callback — promise từ `listen()` gốc không resolve. Caller treo vĩnh viễn.
- **Fix:** 
  1. Thêm `reject` vào Promise executor.
  2. Tách listening callback thành `onListening` riêng để dùng lại.
  3. EADDRINUSE: retry sau 1s với `onListening` callback — resolve promise gốc khi retry thành công.
  4. Error khác hoặc retry thất bại: `reject(error)`.
- **Tài liệu:** [Design](designs/bug-015-pcap-promise-hang.design.md) | [Spec](specs/bug-015-pcap-promise-hang.spec.md) | [Plan](plans/bug-015-pcap-promise-hang.plan.md) | [Overview](overviews/bug-015-pcap-promise-hang.overview.md)
- **GitHub:** [#8](https://github.com/maxlogvn/finger-chromium/issues/8) (closed)

---

**`defaultLauncher` mutable state gây khó unit test**
- **File:** `src/adapter/playwright/engine.ts:30-36`, `src/adapter/playwright/chromium.ts:75`
- **Vấn đề:** `defaultLauncher` là object khởi tạo ở module scope — global mutable state. Khi test với launcher mock, state này không thể thay thế được vì đã resolve tại thời điểm import.
- **Fix:**
  1. Xoá `defaultLauncher` và `browserType` khỏi module scope, thay bằng `createDefaultLauncher()` factory function trong `engine.ts`.
  2. `PlaywrightFingerprintPlugin` constructor dùng `launcher ?? createDefaultLauncher()`.
  3. `BrowserEngine` constructor nhận `launcher?: Launcher` param — inject được mock khi unit test.
- **Tài liệu:** [Design](designs/bug-011-default-launcher.design.md) | [Spec](specs/bug-011-default-launcher.spec.md) | [Plan](plans/bug-011-default-launcher.plan.md) | [Overview](overviews/bug-011-default-launcher.overview.md)
- **GitHub:** [#3](https://github.com/maxlogvn/finger-chromium/issues/3) (closed)

---

**Mỗi lần gọi API spawn một process engine mới, không tái sử dụng**
- **File:** `src/plugin/connector/engine.ts:337-353`
- **Vấn đề:** `runFunction()` gọi `#startProcess()` mỗi lần, không kiểm tra process cũ còn sống. Mỗi API call spawn `FastExecuteScript.exe` mới — tốn tài nguyên và chậm.
- **Fix:** Cache engine process — kiểm tra `this.#process` còn alive không, chỉ spawn lại nếu process đã chết.
- **Tài liệu:** [Design](designs/bug-018-engine-process-cache.design.md) | [Spec](specs/bug-018-engine-process-cache.spec.md) | [Plan](plans/bug-018-engine-process-cache.plan.md) | [Overview](overviews/bug-018-engine-process-cache.overview.md)
- **GitHub:** [#11](https://github.com/maxlogvn/finger-chromium/issues/11) (closed)

---

**`notify()` dead code**
- **File:** `src/plugin/connector/utils.ts`, `src/plugin/connector/index.ts`
- **Vấn đề:** `notify()` được định nghĩa và export nhưng không có file nào import. `notifyTimer` được khai báo, `clearTimeout(notifyTimer)` có trong `finally`, nhưng `notifyTimer` không bao giờ được gán giá trị.
- **Fix:** Import `notify()` vào `connector/index.ts` và gọi trong `api()` khi engine trả lỗi "key is missing". Sửa kiểu `notifyTimer` cho tương thích.
- **Tài liệu:** [Design](designs/bug-001-notify-dead-code.design.md) | [Spec](specs/bug-001-notify-dead-code.spec.md) | [Plan](plans/bug-001-notify-dead-code.plan.md) | [Overview](overviews/bug-001-notify-dead-code.overview.md)
- **GitHub:** [#20](https://github.com/maxlogvn/finger-chromium/issues/20) (closed)

---

**Error classes không export trong public API**
- **File:** `src/index.ts`
- **Vấn đề:** `PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError` (trong `src/plugin/errors.ts`) không được re-export ra public API.
- **Fix:** Thêm export block 5 error class từ `./plugin/errors` vào `src/index.ts`.
- **Tài liệu:** [Design](designs/bug-002-export-error-classes.design.md) | [Spec](specs/bug-002-export-error-classes.spec.md) | [Plan](plans/bug-002-export-error-classes.plan.md) | [Overview](overviews/bug-002-export-error-classes.overview.md)
- **GitHub:** [#14](https://github.com/maxlogvn/finger-chromium/issues/14) (closed)

---

**`quit()` xoá toàn bộ `BROWSER_RUNNING_DIR` thay vì chỉ xoá temp dir của instance**
- **File:** `src/adapter/playwright/chromium.ts:quit()`
- **Vấn đề:** `this.dataManager.unmap(BROWSER_RUNNING_DIR)` xoá cả thư mục gốc `.tmp/browser/running/`, không chỉ temp dir của instance hiện tại.
- **Fix:** Đổi `this.dataManager.unmap(BROWSER_RUNNING_DIR)` thành `this.dataManager.dispose()` — chỉ xoá `instanceTempDir` của instance hiện tại.
- **Tài liệu:** [Design](designs/bug-003-quit-unmap-root.design.md) | [Spec](specs/bug-003-quit-unmap-root.spec.md) | [Plan](plans/bug-003-quit-unmap-root.plan.md) | [Overview](overviews/bug-003-quit-unmap-root.overview.md)
- **GitHub:** [#15](https://github.com/maxlogvn/finger-chromium/issues/15) (closed)

---

**JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại**
- **File:** `src/types/PWChromium.ts:17,25`
- **Vấn đề:** JSDoc example gọi `usePrivateKey()` — method không tồn tại trong interface.
- **Fix:** Xoá tham chiếu `usePrivateKey()`, thay bằng hướng dẫn set biến môi trường `BABLOSOFT_KEY`.
- **Tài liệu:** [Design](designs/bug-004-jsdoc-privatekey.design.md) | [Spec](specs/bug-004-jsdoc-privatekey.spec.md) | [Plan](plans/bug-004-jsdoc-privatekey.plan.md) | [Overview](overviews/bug-004-jsdoc-privatekey.overview.md)
- **GitHub:** [#16](https://github.com/maxlogvn/finger-chromium/issues/16) (closed)

---

**`npm run clean` không tương thích Windows**
- **File:** `package.json`
- **Vấn đề:** Dùng `rm -rf` không chạy được trên Windows.
- **Fix:** Chuyển sang `tsup --clean` (built-in, cross-platform).
- **GitHub:** [#17](https://github.com/maxlogvn/finger-chromium/issues/17) (closed)

---

**Mutex path resolution sai sau khi tsup bundle**
- **File:** `src/plugin/mutex/index.ts`
- **Vấn đề:** Hardcoded `../../../` trong path resolve bị sai sau khi tsup bundle.
- **Fix:** Walk-up algorithm tìm package root (`resolvePackageRoot`).
- **Tài liệu:** [Design](designs/mutex-path-resolution.design.md) | [Spec](specs/mutex-path-resolution.spec.md)
- **GitHub:** [#18](https://github.com/maxlogvn/finger-chromium/issues/18) (closed)

---

**Singleton `Chromium` không hỗ trợ launch nhiều profile song song**
- **File:** `src/adapter/playwright/chromium.ts`, `tests/multi_context.ts`
- **Vấn đề:** `BrowserEngine` là singleton — `launch()` chỉ cho phép gọi một lần. Test `multi_context.ts` gọi launch cho 2 profile khác nhau trên cùng instance, lỗi `"Phuong thuc launch() chi duoc goi mot lan."`.
- **Fix:** Xoá singleton `Chromium`, export class `BrowserEngine` trực tiếp. Mỗi `new BrowserEngine()` là instance độc lập, có thể launch riêng. Giữ alias `Chromium = BrowserEngine` cho backward compatibility.
- **Tài liệu:** [Design](designs/bug-007-multi-profile-singleton.design.md) | [Spec](specs/bug-007-multi-profile-singleton.spec.md) | [Plan](plans/bug-007-multi-profile-singleton.plan.md) | [Overview](overviews/bug-007-multi-profile-singleton.overview.md)
- **GitHub:** [#19](https://github.com/maxlogvn/finger-chromium/issues/19) (closed)

---

**Engine download URL dùng HTTP không an toàn**
- **File:** `src/plugin/connector/engine.ts:146-168,407-408`
- **Vấn đề:** URL metadata fetch dùng `http://bablosoft.com/...` và URL download engine binary từ metadata cũng là HTTP — dễ bị MITM tấn công khi tải engine.
- **Fix:**
  1. Thêm helper `fetchWithFallback()` — thử HTTPS trước, fallback HTTP nếu network error.
  2. Đổi metadata URL từ `http://` sang `https://`.
  3. Dùng `fetchWithFallback()` cho cả metadata fetch và download engine.
- **Tài liệu:** [Design](designs/bug-008-https-fallback.design.md) | [Spec](specs/bug-008-https-fallback.spec.md) | [Plan](plans/bug-008-https-fallback.plan.md) | [Overview](overviews/bug-008-https-fallback.overview.md)
- **GitHub:** [#4](https://github.com/maxlogvn/finger-chromium/issues/4) (closed)

---

**`BrowserEngine.launch()` dùng `Error` thô thay vì `PluginError`** (sweep fix toàn bộ codebase)
- **File:** `src/adapter/playwright/chromium.ts`, `src/plugin/mutex/index.ts`, `src/plugin/connector/engine.ts`, `src/plugin/utils.ts`, `src/adapter/playwright/data.ts`, `src/adapter/playwright/engine.ts`, `src/loader/index.ts`, `eslint.config.ts`
- **Vấn đề:** Toàn bộ codebase có 17 `throw new Error(...)` thay vì `PluginError` — vi phạm CONVENTIONS.md yêu cầu dùng `PluginError` cho mọi lỗi engine. Gồm: 3 trong `chromium.ts`, 3 trong `mutex/index.ts`, 2 trong `connector/engine.ts`, 2 trong `plugin/utils.ts`, 2 trong `data.ts`, 2 trong `engine.ts`, 3 trong `loader/index.ts`.
- **Fix:** 
  1. Đổi tất cả 17 `throw new Error(...)` thành `PluginError` hoặc subclass (`InvalidEngineError`).
  2. Thêm ESLint rule `no-restricted-syntax` với AST selector `ThrowStatement > NewExpression > Identifier.callee[name="Error"]` — tự động báo lỗi nếu ai đó dùng `throw new Error(...)` trong `src/`.
- **Tài liệu:** [Design](designs/bug-009-error-tho.design.md) | [Spec](specs/bug-009-error-tho.spec.md) | [Plan](plans/bug-009-error-tho.plan.md) | [Overview](overviews/bug-009-error-tho.overview.md)
- **GitHub:** [#1](https://github.com/maxlogvn/finger-chromium/issues/1) (closed)

---

**Import path alias `'src/types/fetch'` không khớp tsconfig**
- **File:** `src/adapter/playwright/chromium.ts:24`
- **Vấn đề:** Import `from 'src/types/fetch'` — tsconfig.json chỉ define alias `@src/*`, không define `src/*`. Không resolve được ở ts-node/jiti runtime nếu không có tsconfig paths support.
- **Fix:** Đổi thành relative path `from '../../types/fetch'` — nhất quán với các import type khác trong cùng file.
- **Tài liệu:** [Design](designs/bug-010-import-path-alias.design.md) | [Spec](specs/bug-010-import-path-alias.spec.md) | [Plan](plans/bug-010-import-path-alias.plan.md) | [Overview](overviews/bug-010-import-path-alias.overview.md)
- **GitHub:** [#2](https://github.com/maxlogvn/finger-chromium/issues/2) (closed)

---

**`cleaner` dùng `posix` path trên Windows**
- **File:** `src/plugin/cleaner.ts`
- **Vấn đề:** `import { posix as path } from 'path'` — forward slash dùng với `proper-lockfile` trên Windows gây lỗi lock/unlock file.
- **Fix:** Đổi thành `import path from 'node:path'` (Windows native).
- **Tài liệu:** [Design](designs/bug-016-posix-path.design.md) | [Spec](specs/bug-016-posix-path.spec.md) | [Plan](plans/bug-016-posix-path.plan.md) | [Overview](overviews/bug-016-posix-path.overview.md)
- **GitHub:** [#9](https://github.com/maxlogvn/finger-chromium/issues/9) (closed)

---

**`synchronize` ghi `BAS_NOT_SET` cho `availWidth/availHeight` vì sai tên key**
- **File:** `src/plugin/config.ts`
- **Vấn đề:** `synchronize` tìm key `availWidth`/`availHeight` trong `bounds`, nhưng API setup trả về `width`/`height` — luôn ghi `BAS_NOT_SET`.
- **Fix:** Map `availWidth → width`, `availHeight → height` trong loop key.
- **Tài liệu:** [Design](designs/bug-017-synchronize-key.design.md) | [Spec](specs/bug-017-synchronize-key.spec.md) | [Plan](plans/bug-017-synchronize-key.plan.md) | [Overview](overviews/bug-017-synchronize-key.overview.md)
- **GitHub:** [#10](https://github.com/maxlogvn/finger-chromium/issues/10) (closed)

---

**PCAP server `listen()` khởi động ở module scope (side effect)**
- **File:** `src/plugin/connector/index.ts:63-66`
- **Vấn đề:** `pcapServer.listen()` được gọi ngay khi import module. Chỉ cần `import` file này (dù chỉ để lấy type) cũng mở một TCP server — rất nguy hiểm trong unit test.
- **Fix:** Chuyển `pcapServer.listen()` vào lazy init trong `api()` — dùng module-level promise `ensureInit()` để chỉ chạy một lần ở lần gọi API đầu tiên.
- **Tài liệu:** [Design](designs/bug-012-pcap-side-effect.design.md) | [Spec](specs/bug-012-pcap-side-effect.spec.md) | [Plan](plans/bug-012-pcap-side-effect.plan.md) | [Overview](overviews/bug-012-pcap-side-effect.overview.md)
- **GitHub:** [#5](https://github.com/maxlogvn/finger-chromium/issues/5) (closed)

---

**Cleaner singleton dùng chung giữa các BrowserEngine instance**
- **File:** `src/plugin/cleaner.ts:30`, `src/plugin/index.ts:69-76`
- **Vấn đề:** `export default new SettingsCleaner()` — tất cả instance đều dùng chung một cleaner. Instance A có thể cleanup file của instance B (race condition).
- **Fix:**
  1. Thêm `export` vào `class SettingsCleaner` để consumer có thể tạo instance riêng.
  2. `FingerprintPlugin` tạo `#cleaner = new SettingsCleaner()` riêng, không dùng singleton.
  3. Giữ `export default new SettingsCleaner()` cho backward compatibility.
- **Tài liệu:** [Design](designs/bug-013-cleaner-singleton.design.md) | [Spec](specs/bug-013-cleaner-singleton.spec.md) | [Plan](plans/bug-013-cleaner-singleton.plan.md) | [Overview](overviews/bug-013-cleaner-singleton.overview.md)
- **GitHub:** [#6](https://github.com/maxlogvn/finger-chromium/issues/6) (closed)

---

**Dead export SettingsCleaner default**
- **File:** `src/plugin/cleaner.ts:118`
- **Vấn đề:** `export default new SettingsCleaner()` không còn production code nào import — sót lại từ refactor per-instance cleaner.
- **Fix:**
  1. Thêm `@deprecated` JSDoc cho default export.
  2. Refactor test `quit-cleanup.test.ts` sang dùng `new SettingsCleaner()` thay vì default import.
- **Tài liệu:** [Design](designs/bug-025-dead-export-settingscleaner.design.md) | [Spec](specs/bug-025-dead-export-settingscleaner.spec.md) | [Plan](plans/bug-025-dead-export-settingscleaner.plan.md) | [Overview](overviews/bug-025-dead-export-settingscleaner.overview.md)
- **GitHub:** [#25](https://github.com/maxlogvn/finger-chromium/issues/25) (closed)

---

**File corrupt tích luỹ khi download engine thất bại**
- **File:** `src/plugin/connector/engine.ts:129-145`
- **Vấn đề:** `download()` mở file đích ngay từ đầu (`createWriteStream(filePath)`) và không dọn dẹp file partial khi download thất bại.
- **Fix:** Chuyển sang cơ chế temp file + rename — ghi vào file `.tmp`, `rename()` thành file đích sau khi pipeline thành công, xoá `.tmp` trong catch khi lỗi. Fallback `copyFile` + `unlink` nếu cross-device rename.
- **Tài liệu:** [Design](designs/bug-024-download-cleanup.design.md) | [Spec](specs/bug-024-download-cleanup.spec.md) | [Plan](plans/bug-024-download-cleanup.plan.md) | [Overview](overviews/bug-024-download-cleanup.overview.md)
- **GitHub:** [#24](https://github.com/maxlogvn/finger-chromium/issues/24) (closed)
