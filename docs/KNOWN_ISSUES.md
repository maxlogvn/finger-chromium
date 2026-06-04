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

- **OPEN:** 7 issues — xem section OPEN bên dưới
- **FIXED:** 25 issues đã đóng trên GitHub — xem từng entry với số GitHub tương ứng

### Quy trình fix một issue

1. **Chọn issue** từ KNOWN_ISSUES.md (OPEN) hoặc GitHub Issues.
2. **Fix code** theo đúng quy trình WORKFLOW.md.
3. **Cập nhật KNOWN_issues.md**: chuyển từ OPEN sang FIXED, thêm link tài liệu.
4. **Commit code**: commit tất cả thay đổi (code + docs), lấy full commit hash 40 ký tự.
5. **Đồng bộ lên GitHub**: tạo/update GitHub issue, thêm closing comment là nội dung overview từ `docs/overviews/<bug>.overview.md` (bằng tiếng Việt có dấu).
6. **Đóng GitHub issue** sau khi đã verify fix.

> **Số thứ tự:** Không dùng local numbering. Entry mới đặt ở cuối section FIXED, dùng số GitHub issue duy nhất.

### Quy tắc comment trên GitHub Issues

Mỗi GitHub issue (kể cả đã đóng) phải có một comment duy nhất là nội dung overview từ `docs/overviews/<bug>.overview.md` — dùng luôn file overview làm closing comment.

### Tạo issue mới

Khi phát hiện bug hoặc vấn đề mới:
1. Tạo GitHub issue mới với nội dung chi tiết.
2. Thêm entry vào KNOWN_ISSUES.md (section OPEN) theo template bên dưới — không dùng local numbering, chỉ ghi số GitHub vào trường `GitHub:`.
3. Khi fix xong, chuyển entry sang section FIXED, thêm link tài liệu và đóng GitHub issue.

### Template cho issue mới

Khi tạo GitHub issue mới, dùng template [`docs/templates/known-issue.template.md`](templates/known-issue.template.md) để viết body issue.

Entry trong KNOWN_ISSUES.md dùng format ngắn gọn (không theo template trên). Có 2 dạng:

| Loại | Khi nào dùng |
|------|-------------|
| OPEN | Bug đã ghi nhận, chưa sửa |
| FIXED | Bug đã sửa, đã có tài liệu |

> **Ghi chú:** Không dùng local numbering. Mỗi entry chỉ có mô tả + số GitHub issue tương ứng.

### OPEN



**Static property `_execFile`/`_closeTimeout` expose ra public cho testing (P1)**
- **File:** `src/plugin/connector/engine.ts:194,197`
- **Vấn đề:** `RemoteEngine._execFile` và `RemoteEngine._closeTimeout` là static public property, chỉ dùng để mock trong test. Dev khác có thể vô tình ghi đè, crash toàn bộ engine. `@internal` JSDoc không ngăn được abuse.
- **Liên quan:** Bug test-runfunction-ipc-core (Issue #28).
- **GitHub:** [#34](https://github.com/maxlogvn/finger-chromium/issues/34) (open)

---

**Timer management không đồng nhất (P2)**
- **File:** `src/plugin/config.ts:109`, `src/plugin/connector/engine.ts:283,419`, `src/plugin/connector/index.ts`
- **Vấn đề:** Dùng 2 style timer: `timers/promises` (config.ts) và `setTimeout().unref()` callback style (connector/engine.ts). Khó maintain, khó test. Không có centralized wrapper.
- **GitHub:** [#35](https://github.com/maxlogvn/finger-chromium/issues/35) (open)

---

**Headless viewport resize không chính xác (P2)**
- **File:** `src/adapter/playwright/utils.ts:82-112`
- **Vấn đề:** `setViewport()` dùng CDP `Browser.setWindowBounds` — API này không hoạt động trong `headless: true`. Dev đã ghi nhận trong overview nhưng chưa fix.
- **GitHub:** [#36](https://github.com/maxlogvn/finger-chromium/issues/36) (open)

---

**EADDRINUSE retry logic trong PCAP server không test được trên Windows**
- **File:** `src/plugin/connector/pcapServer/index.ts:23-64`, `tests/connector.test.ts`
- **Thay đổi:** `once()` wrapper đã được thay bằng `startPromise` module-level caching. `close()` reset `startPromise` để cho phép restart server. Đã thêm 2 test cases mới: idempotent listen + restart after close. Tuy nhiên, EADDRINUSE retry logic không thể test trên Windows do `net.Server` dùng `SO_REUSEADDR` mặc định.
- **Windows limitation:** `net.Server` không throw EADDRINUSE trên Windows vì `SO_REUSEADDR` được bật mặc định. EADDRINUSE retry test chỉ chạy được trên Linux/macOS.
- **Tài liệu:** [Design](designs/bug-029-eaddrInuse-retry-test.design.md) | [Spec](specs/bug-029-eaddrInuse-retry-test.spec.md) | [Plan](plans/bug-029-eaddrInuse-retry-test.plan.md) | [Overview](overviews/bug-029-eaddrInuse-retry-test.overview.md)
- **GitHub:** [#29](https://github.com/maxlogvn/finger-chromium/issues/29) (open)

---

**Thiếu test coverage cho HTTPS fallback và fetchWithFallback() trong download()**
- **File:** `src/plugin/connector/engine.ts:130-183`, `tests/connector.test.ts`
- **Vấn đề:** Hàm `download()` có fallback HTTPS→HTTP khi network error, và `fetchWithFallback()` được export để test. Cả hai đều không có test coverage. Fallback path (HTTPS fail → HTTP) là critical path cho việc tải engine — nếu hỏng, engine không bao giờ được tải xuống. Dự án đã từng có bug liên quan (Issue #4).
- **GitHub:** [#30](https://github.com/maxlogvn/finger-chromium/issues/30) (open)

---

**Thiếu test coverage cho async-lock concurrency trong Connector.api()**
- **File:** `src/plugin/connector/index.ts:61,119`, `tests/connector.test.ts`
- **Vấn đề:** Connector dùng `async-lock` để đảm bảo chỉ một request IPC tại một thời điểm. Không có test nào kiểm tra lock behavior khi có concurrent calls — nếu lock hỏng, hai request có thể ghi chồng lên cùng file request, corrupt dữ liệu IPC.
- **GitHub:** [#31](https://github.com/maxlogvn/finger-chromium/issues/31) (open)

---

### FIXED

**Thiếu integration test với engine binary thật `FastExecuteScript.exe` (P0)**
- **File:** `tests/integration-connector.test.ts`, `tests/connector.test.ts`, `src/plugin/connector/engine.ts`
- **Vấn đề:** 162 tests hiện tại đều là unit/hybrid. Không có test nào gọi engine thật (`FastExecuteScript.exe`). Engine API có thể fail hoàn toàn mà dev không biết.
- **Tài liệu:** [Design](designs/test-integration-engine-binary.design.md) | [Spec](specs/test-integration-engine-binary.spec.md) | [Plan](plans/test-integration-engine-binary.plan.md) | [Overview](overviews/test-integration-engine-binary.overview.md)
- **GitHub:** [#33](https://github.com/maxlogvn/finger-chromium/issues/33) (closed)

---

**`isBrowser` type guard dùng string check fragile**
- **File:** `src/adapter/playwright/utils.ts:19-23`
- **Vấn đề:** Phân biệt `Browser` vs `BrowserContext` bằng cách check method `version()` tồn tại. Nếu Playwright thay đổi API, type guard sai.
- **Tài liệu:** [Design](designs/bug-019-isbrowser-typeguard.design.md) | [Spec](specs/bug-019-isbrowser-typeguard.spec.md) | [Plan](plans/bug-019-isbrowser-typeguard.plan.md) | [Overview](overviews/bug-019-isbrowser-typeguard.overview.md)
- **GitHub:** [#12](https://github.com/maxlogvn/finger-chromium/issues/12) (closed)

---

**Hardcoded `await setTimeout(2000)` bên trong async-lock**
- **File:** `src/plugin/config.ts:83`
- **Vấn đề:** `synchronize()` dùng `await setTimeout(2000)` hai lần bên trong `lock.acquire` — mỗi lần 4 giây chờ vô ích.
- **Tài liệu:** [Design](designs/bug-020-setTimeout-async-lock.design.md) | [Spec](specs/bug-020-setTimeout-async-lock.spec.md) | [Plan](plans/bug-020-setTimeout-async-lock.plan.md) | [Overview](overviews/bug-020-setTimeout-async-lock.overview.md)
- **GitHub:** [#13](https://github.com/maxlogvn/finger-chromium/issues/13) (closed)

---

**Cleaner race condition khi cleanup: chờ engine process thoát hẳn**
- **File:** `src/plugin/index.ts:291`, `src/plugin/connector/index.ts:142-144`, `src/plugin/connector/engine.ts:372-397`
- **Vấn đề:** `RemoteEngine.kill()` là fire-and-forget (trả về `void`), không đợi `FastExecuteScript.exe` thoát hẳn. `FingerprintPlugin.cleanup()` gọi `cleaner.stop()` ngay sau đó khi process còn ghi file, gây `EBUSY` trên Windows.
- **Tài liệu:** [Design](designs/bug-023-cleanup-race-condition.design.md) | [Spec](specs/bug-023-cleanup-race-condition.spec.md) | [Plan](plans/bug-023-cleanup-race-condition.plan.md) | [Overview](overviews/bug-023-cleanup-race-condition.overview.md)
- **GitHub:** [#23](https://github.com/maxlogvn/finger-chromium/issues/23) (closed)

---

**`RemoteEngine` singleton dùng chung giữa các instance**
- **File:** `src/plugin/connector/index.ts`, `src/plugin/index.ts`
- **Vấn đề:** `RemoteEngine` là singleton global — tất cả `FingerprintPlugin` instance dùng chung một engine process. `kill()` trên một instance giết process của tất cả instance khác.
- **Tài liệu:** [Design](designs/bug-014-remote-engine-factory.design.md) | [Spec](specs/bug-014-remote-engine-factory.spec.md) | [Plan](plans/bug-014-remote-engine-factory.plan.md) | [Overview](overviews/bug-014-remote-engine-factory.overview.md)
- **GitHub:** [#7](https://github.com/maxlogvn/finger-chromium/issues/7) (closed)

---

**PCAP server retry EADDRINUSE nhưng promise gốc không bao giờ resolve**
- **File:** `src/plugin/connector/pcapServer/index.ts`
- **Vấn đề:** Khi port bận, error handler gọi `svr.listen()` lại mà không gắn callback — promise từ `listen()` gốc không resolve. Caller treo vĩnh viễn.
- **Tài liệu:** [Design](designs/bug-015-pcap-promise-hang.design.md) | [Spec](specs/bug-015-pcap-promise-hang.spec.md) | [Plan](plans/bug-015-pcap-promise-hang.plan.md) | [Overview](overviews/bug-015-pcap-promise-hang.overview.md)
- **GitHub:** [#8](https://github.com/maxlogvn/finger-chromium/issues/8) (closed)

---

**`defaultLauncher` mutable state gây khó unit test**
- **File:** `src/adapter/playwright/engine.ts:30-36`, `src/adapter/playwright/chromium.ts:75`
- **Vấn đề:** `defaultLauncher` là object khởi tạo ở module scope — global mutable state. Khi test với launcher mock, state này không thể thay thế được vì đã resolve tại thời điểm import.
- **Tài liệu:** [Design](designs/bug-011-default-launcher.design.md) | [Spec](specs/bug-011-default-launcher.spec.md) | [Plan](plans/bug-011-default-launcher.plan.md) | [Overview](overviews/bug-011-default-launcher.overview.md)
- **GitHub:** [#3](https://github.com/maxlogvn/finger-chromium/issues/3) (closed)

---

**Mỗi lần gọi API spawn một process engine mới, không tái sử dụng**
- **File:** `src/plugin/connector/engine.ts:337-353`
- **Vấn đề:** `runFunction()` gọi `#startProcess()` mỗi lần, không kiểm tra process cũ còn sống. Mỗi API call spawn `FastExecuteScript.exe` mới — tốn tài nguyên và chậm.
- **Tài liệu:** [Design](designs/bug-018-engine-process-cache.design.md) | [Spec](specs/bug-018-engine-process-cache.spec.md) | [Plan](plans/bug-018-engine-process-cache.plan.md) | [Overview](overviews/bug-018-engine-process-cache.overview.md)
- **GitHub:** [#11](https://github.com/maxlogvn/finger-chromium/issues/11) (closed)

---

**`notify()` dead code**
- **File:** `src/plugin/connector/utils.ts`, `src/plugin/connector/index.ts`
- **Vấn đề:** `notify()` được định nghĩa và export nhưng không có file nào import. `notifyTimer` được khai báo, `clearTimeout(notifyTimer)` có trong `finally`, nhưng `notifyTimer` không bao giờ được gán giá trị.
- **Tài liệu:** [Design](designs/bug-001-notify-dead-code.design.md) | [Spec](specs/bug-001-notify-dead-code.spec.md) | [Plan](plans/bug-001-notify-dead-code.plan.md) | [Overview](overviews/bug-001-notify-dead-code.overview.md)
- **GitHub:** [#20](https://github.com/maxlogvn/finger-chromium/issues/20) (closed)

---

**Error classes không export trong public API**
- **File:** `src/index.ts`
- **Vấn đề:** `PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError` (trong `src/plugin/errors.ts`) không được re-export ra public API.
- **Tài liệu:** [Design](designs/bug-002-export-error-classes.design.md) | [Spec](specs/bug-002-export-error-classes.spec.md) | [Plan](plans/bug-002-export-error-classes.plan.md) | [Overview](overviews/bug-002-export-error-classes.overview.md)
- **GitHub:** [#14](https://github.com/maxlogvn/finger-chromium/issues/14) (closed)

---

**`quit()` xoá toàn bộ `BROWSER_RUNNING_DIR` thay vì chỉ xoá temp dir của instance**
- **File:** `src/adapter/playwright/chromium.ts:quit()`
- **Vấn đề:** `this.dataManager.unmap(BROWSER_RUNNING_DIR)` xoá cả thư mục gốc `.tmp/browser/running/`, không chỉ temp dir của instance hiện tại.
- **Tài liệu:** [Design](designs/bug-003-quit-unmap-root.design.md) | [Spec](specs/bug-003-quit-unmap-root.spec.md) | [Plan](plans/bug-003-quit-unmap-root.plan.md) | [Overview](overviews/bug-003-quit-unmap-root.overview.md)
- **GitHub:** [#15](https://github.com/maxlogvn/finger-chromium/issues/15) (closed)

---

**JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại**
- **File:** `src/types/PWChromium.ts:17,25`
- **Vấn đề:** JSDoc example gọi `usePrivateKey()` — method không tồn tại trong interface.
- **Tài liệu:** [Design](designs/bug-004-jsdoc-privatekey.design.md) | [Spec](specs/bug-004-jsdoc-privatekey.spec.md) | [Plan](plans/bug-004-jsdoc-privatekey.plan.md) | [Overview](overviews/bug-004-jsdoc-privatekey.overview.md)
- **GitHub:** [#16](https://github.com/maxlogvn/finger-chromium/issues/16) (closed)

---

**`npm run clean` không tương thích Windows**
- **File:** `package.json`
- **Vấn đề:** Dùng `rm -rf` không chạy được trên Windows.
- **Tài liệu:** [Overview](overviews/bug-017-npm-run-clean.overview.md)
- **GitHub:** [#17](https://github.com/maxlogvn/finger-chromium/issues/17) (closed)

---

**Mutex path resolution sai sau khi tsup bundle**
- **File:** `src/plugin/mutex/index.ts`
- **Vấn đề:** Hardcoded `../../../` trong path resolve bị sai sau khi tsup bundle.
- **Tài liệu:** [Design](designs/mutex-path-resolution.design.md) | [Spec](specs/mutex-path-resolution.spec.md) | [Overview](overviews/bug-018-mutex-path-resolution.overview.md)
- **GitHub:** [#18](https://github.com/maxlogvn/finger-chromium/issues/18) (closed)

---

**Singleton `Chromium` không hỗ trợ launch nhiều profile song song**
- **File:** `src/adapter/playwright/chromium.ts`, `tests/multi_context.ts`
- **Vấn đề:** `BrowserEngine` là singleton — `launch()` chỉ cho phép gọi một lần. Test `multi_context.ts` gọi launch cho 2 profile khác nhau trên cùng instance, lỗi `"Phuong thuc launch() chi duoc goi mot lan."`.
- **Tài liệu:** [Design](designs/bug-007-multi-profile-singleton.design.md) | [Spec](specs/bug-007-multi-profile-singleton.spec.md) | [Plan](plans/bug-007-multi-profile-singleton.plan.md) | [Overview](overviews/bug-007-multi-profile-singleton.overview.md)
- **GitHub:** [#19](https://github.com/maxlogvn/finger-chromium/issues/19) (closed)

---

**Engine download URL dùng HTTP không an toàn**
- **File:** `src/plugin/connector/engine.ts:146-168,407-408`
- **Vấn đề:** URL metadata fetch dùng `http://bablosoft.com/...` và URL download engine binary từ metadata cũng là HTTP — dễ bị MITM tấn công khi tải engine.
- **Tài liệu:** [Design](designs/bug-008-https-fallback.design.md) | [Spec](specs/bug-008-https-fallback.spec.md) | [Plan](plans/bug-008-https-fallback.plan.md) | [Overview](overviews/bug-008-https-fallback.overview.md)
- **GitHub:** [#4](https://github.com/maxlogvn/finger-chromium/issues/4) (closed)

---

**`BrowserEngine.launch()` dùng `Error` thô thay vì `PluginError`** (sweep fix toàn bộ codebase)
- **File:** `src/adapter/playwright/chromium.ts`, `src/plugin/mutex/index.ts`, `src/plugin/connector/engine.ts`, `src/plugin/utils.ts`, `src/adapter/playwright/data.ts`, `src/adapter/playwright/engine.ts`, `src/loader/index.ts`, `eslint.config.ts`
- **Vấn đề:** Toàn bộ codebase có 17 `throw new Error(...)` thay vì `PluginError` — vi phạm CONVENTIONS.md yêu cầu dùng `PluginError` cho mọi lỗi engine. Gồm: 3 trong `chromium.ts`, 3 trong `mutex/index.ts`, 2 trong `connector/engine.ts`, 2 trong `plugin/utils.ts`, 2 trong `data.ts`, 2 trong `engine.ts`, 3 trong `loader/index.ts`.
- **Tài liệu:** [Design](designs/bug-009-error-tho.design.md) | [Spec](specs/bug-009-error-tho.spec.md) | [Plan](plans/bug-009-error-tho.plan.md) | [Overview](overviews/bug-009-error-tho.overview.md)
- **GitHub:** [#1](https://github.com/maxlogvn/finger-chromium/issues/1) (closed)

---

**Import path alias `'src/types/fetch'` không khớp tsconfig**
- **File:** `src/adapter/playwright/chromium.ts:24`
- **Vấn đề:** Import `from 'src/types/fetch'` — tsconfig.json chỉ define alias `@src/*`, không define `src/*`. Không resolve được ở ts-node/jiti runtime nếu không có tsconfig paths support.
- **Tài liệu:** [Design](designs/bug-010-import-path-alias.design.md) | [Spec](specs/bug-010-import-path-alias.spec.md) | [Plan](plans/bug-010-import-path-alias.plan.md) | [Overview](overviews/bug-010-import-path-alias.overview.md)
- **GitHub:** [#2](https://github.com/maxlogvn/finger-chromium/issues/2) (closed)

---

**`cleaner` dùng `posix` path trên Windows**
- **File:** `src/plugin/cleaner.ts`
- **Vấn đề:** `import { posix as path } from 'path'` — forward slash dùng với `proper-lockfile` trên Windows gây lỗi lock/unlock file.
- **Tài liệu:** [Design](designs/bug-016-posix-path.design.md) | [Spec](specs/bug-016-posix-path.spec.md) | [Plan](plans/bug-016-posix-path.plan.md) | [Overview](overviews/bug-016-posix-path.overview.md)
- **GitHub:** [#9](https://github.com/maxlogvn/finger-chromium/issues/9) (closed)

---

**`synchronize` ghi `BAS_NOT_SET` cho `availWidth/availHeight` vì sai tên key**
- **File:** `src/plugin/config.ts`
- **Vấn đề:** `synchronize` tìm key `availWidth`/`availHeight` trong `bounds`, nhưng API setup trả về `width`/`height` — luôn ghi `BAS_NOT_SET`.
- **Tài liệu:** [Design](designs/bug-017-synchronize-key.design.md) | [Spec](specs/bug-017-synchronize-key.spec.md) | [Plan](plans/bug-017-synchronize-key.plan.md) | [Overview](overviews/bug-017-synchronize-key.overview.md)
- **GitHub:** [#10](https://github.com/maxlogvn/finger-chromium/issues/10) (closed)

---

**PCAP server `listen()` khởi động ở module scope (side effect)**
- **File:** `src/plugin/connector/index.ts:63-66`
- **Vấn đề:** `pcapServer.listen()` được gọi ngay khi import module. Chỉ cần `import` file này (dù chỉ để lấy type) cũng mở một TCP server — rất nguy hiểm trong unit test.
- **Tài liệu:** [Design](designs/bug-012-pcap-side-effect.design.md) | [Spec](specs/bug-012-pcap-side-effect.spec.md) | [Plan](plans/bug-012-pcap-side-effect.plan.md) | [Overview](overviews/bug-012-pcap-side-effect.overview.md)
- **GitHub:** [#5](https://github.com/maxlogvn/finger-chromium/issues/5) (closed)

---

**Cleaner singleton dùng chung giữa các BrowserEngine instance**
- **File:** `src/plugin/cleaner.ts:30`, `src/plugin/index.ts:69-76`
- **Vấn đề:** `export default new SettingsCleaner()` — tất cả instance đều dùng chung một cleaner. Instance A có thể cleanup file của instance B (race condition).
- **Tài liệu:** [Design](designs/bug-013-cleaner-singleton.design.md) | [Spec](specs/bug-013-cleaner-singleton.spec.md) | [Plan](plans/bug-013-cleaner-singleton.plan.md) | [Overview](overviews/bug-013-cleaner-singleton.overview.md)
- **GitHub:** [#6](https://github.com/maxlogvn/finger-chromium/issues/6) (closed)

---

**Dead export SettingsCleaner default**
- **File:** `src/plugin/cleaner.ts:118`
- **Vấn đề:** `export default new SettingsCleaner()` không còn production code nào import — sót lại từ refactor per-instance cleaner.
- **Tài liệu:** [Design](designs/bug-025-dead-export-settingscleaner.design.md) | [Spec](specs/bug-025-dead-export-settingscleaner.spec.md) | [Plan](plans/bug-025-dead-export-settingscleaner.plan.md) | [Overview](overviews/bug-025-dead-export-settingscleaner.overview.md)
- **GitHub:** [#25](https://github.com/maxlogvn/finger-chromium/issues/25) (closed)

---

**File corrupt tích luỹ khi download engine thất bại**
- **File:** `src/plugin/connector/engine.ts:129-145`
- **Vấn đề:** `download()` mở file đích ngay từ đầu (`createWriteStream(filePath)`) và không dọn dẹp file partial khi download thất bại.
- **Tài liệu:** [Design](designs/bug-024-download-cleanup.design.md) | [Spec](specs/bug-024-download-cleanup.spec.md) | [Plan](plans/bug-024-download-cleanup.plan.md) | [Overview](overviews/bug-024-download-cleanup.overview.md)
- **GitHub:** [#24](https://github.com/maxlogvn/finger-chromium/issues/24) (closed)

---

**AsyncLock module-level gây contention giữa các instance**
- **File:** `src/plugin/config.ts:34,87`, `src/plugin/index.ts:234,277-278`
- **Vấn đề:** `const lock = new AsyncLock()` ở module scope — tất cả `FingerprintPlugin` instance chia sẻ một lock, gây contention khi chạy song song.
- **Tài liệu:** [Design](designs/bug-022-asynclock-per-instance.design.md) | [Spec](specs/bug-022-asynclock-per-instance.spec.md) | [Plan](plans/bug-022-asynclock-per-instance.plan.md) | [Overview](overviews/bug-022-asynclock-per-instance.overview.md)
- **GitHub:** [#22](https://github.com/maxlogvn/finger-chromium/issues/22) (closed)

---

**Process không tự động thoát sau khi quit()**
- **File:** `src/plugin/connector/pcapServer/index.ts:48-55`
- **Vấn đề:** `net.Server` thiếu `unref()` trong callback `onListening` — TCP server giữ event loop alive sau khi cleanup, process không tự động thoát.
- **Tài liệu:** [Design](designs/bug-021-pcap-unref.design.md) | [Spec](specs/bug-021-pcap-unref.spec.md) | [Plan](plans/bug-021-pcap-unref.plan.md) | [Overview](overviews/bug-021-pcap-unref.overview.md)
- **GitHub:** [#21](https://github.com/maxlogvn/finger-chromium/issues/21) (closed)

---

**Thiếu test coverage cho `runFunction()` — IPC core giao tiếp với engine binary**
- **File:** `tests/connector.test.ts`
- **Vấn đề:** Đã thêm 6 test cases cho `RemoteEngine.runFunction()` dùng cơ chế `RemoteEngine._execFile` mock + `_closeTimeout` override. Test đầy đủ: parse response, timeout, invalid JSON, process đóng, dọn file rác, requestTimeout=0.
- **Tài liệu:** [Design](designs/test-runfunction-ipc-core.design.md) | [Spec](specs/test-runfunction-ipc-core.spec.md) | [Plan](plans/test-runfunction-ipc-core.plan.md) | [Overview](overviews/test-runfunction-ipc-core.overview.md)
- **GitHub:** [#28](https://github.com/maxlogvn/finger-chromium/issues/28) (closed)

---

**Module-level `serviceKey` state dùng chung giữa các instance (P0)**
- **File:** `src/plugin/index.ts:61,189-191`
- **Vấn đề:** `let serviceKey` ở module scope — tất cả `FingerprintPlugin` instance chia sẻ một key. Instance A set key, instance B có thể ghi đè. Gây sai key khi dùng multi-instance.
- **Fix:** Chuyển `serviceKey` thành instance private field `#serviceKey`. Xoá module-level `let serviceKey`. Sửa `setServiceKey()`, `fetch()`, `_launch()` dùng `this.#serviceKey`.
- **Tài liệu:** [Design](designs/bug-032-servicekey-module-scope.design.md) | [Spec](specs/bug-032-servicekey-module-scope.spec.md) | [Plan](plans/bug-032-servicekey-module-scope.plan.md)
- **GitHub:** [#32](https://github.com/maxlogvn/finger-chromium/issues/32) (closed)
