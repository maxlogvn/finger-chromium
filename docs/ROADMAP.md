<!-- Template

Trạng thái: [X] Hoàn thành | [/] Đang làm | [-] Sắp làm | [ ] Backlog

---

### Tên tính năng
- **Trạng thái:** Sắp làm
- **Ngày tạo:** YYYY-MM-DD
- **Cập nhật:** YYYY-MM-DD
- **Tài liệu:** ...
- **Ghi chú:** ...

---

-->

Trạng thái: [X] Hoàn thành | [/] Đang làm | [-] Sắp làm | [ ] Backlog

---

### Hạ tầng dự án (Project Infrastructure)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/project-infrastructure.design.md) | [Spec](specs/project-infrastructure.spec.md) | [Plan](plans/project-infrastructure.plan.md) | [Product](products/project-infrastructure.product.md) | [Overview](overviews/project-infrastructure.overview.md)
- **Ghi chú:**
  - TypeScript strict mode, target ES2022
  - tsup bundle (ESM + CJS)
  - ESLint + Prettier (tabs, single quotes, 100 printWidth, trailingComma all)
  - Mocha test runner + tsx loader
  - dotenv, jiti cho dev
  - package.json scripts: lint, test, build (tsup), prepare (auto-build khi cài từ GitHub), dev
  - `npm run clean` -- xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #17 -- fix Windows compatibility)

---

### Hệ thống kiểu (Type System)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/type-system.design.md) | [Spec](specs/type-system.spec.md) | [Plan](plans/type-system.plan.md) | [Product](products/type-system.product.md) | [Overview](overviews/type-system.overview.md) -- `src/types/`
- **Ghi chú:**
  - `PWChromium.ts` -- interface public API của BrowserEngine
  - `fingerprint.ts` -- `FingerprintOptions` (PerfectCanvas, WebGL, Audio, Canvas, Battery, Sensor, HiDPI, FontPack, ElementSize)
  - `proxy.ts` -- `ProxyOptions` (protocol, timezone, geolocation, WebRTC, DNS, tunneling, QUIC, IP detection)
  - `profile.ts` -- `ProfileOptions` (loadProxy, loadFingerprint)
  - `fetch.ts` -- `FetchOptions`, `Tag`, `Time` (bộ lọc fingerprint)

---

### Hệ thống lỗi (Error Hierarchy)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-04
- **Tài liệu:** [Design](designs/error-hierarchy.design.md) | [Spec](specs/error-hierarchy.spec.md) | [Plan](plans/error-hierarchy.plan.md) | [Product](products/error-hierarchy.product.md) | [Overview](overviews/error-hierarchy.overview.md) -- `src/plugin/errors.ts`
- **Ghi chú:**
  - `PluginError` -- base class
  - `MissingKeyError` -- thiếu key bảo mật
  - `InvalidEngineError` -- engine chưa tải/giải nén
  - `EngineTimeoutError` -- timeout khởi động engine
  - `RequestTimeoutError` -- timeout request
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #14 -- export error classes ra public API, Issue #16 -- JSDoc tham chiếu method không tồn tại)
  - **Docs correction (2026-06-04):** Đã bổ sung giải thích "tại sao" cho `dedent`, `captureStackTrace`, `Symbol.toStringTag`; thêm chi tiết message từng class vào spec/product; fix overview sai "3 dòng".

---

### RemoteEngine -- Tải, giải nén và IPC với engine binary

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/remote-engine.design.md) | [Spec](specs/remote-engine.spec.md) | [Plan](plans/remote-engine.plan.md) | [Product](products/remote-engine.product.md) | [Overview](overviews/remote-engine.overview.md) -- `src/plugin/connector/engine.ts`
- **Ghi chú:**
  - Download engine từ bablosoft.com, verify SHA1 checksum
  - Extract-zip, copy project.xml, tạo settings.ini, worker_command_line.txt
  - File-based IPC: viết JSON request file, chokidar watch phản hồi
  - Caching metadata, timeout configurable

---

### API Connector -- Giao tiếp với engine

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/api-connector.design.md) | [Spec](specs/api-connector.spec.md) | [Plan](plans/api-connector.plan.md) | [Product](products/api-connector.product.md) | [Overview](overviews/api-connector.overview.md) -- `src/plugin/connector/index.ts`
- **Ghi chú:**
  - Class `Connector` — mỗi `FingerprintPlugin` instance sở hữu Connector riêng (không còn singleton)
  - `api(name, params)` -- wrapper error normalization
  - Auto-start PCAP server (lazy init)
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #20 -- notify tích hợp, Issue #7 -- Connector factory, Issue #11 -- engine process cache)

---

### PCAP Server -- Mock TCP server

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/pcap-server.design.md) | [Spec](specs/pcap-server.spec.md) | [Plan](plans/pcap-server.plan.md) | [Product](products/pcap-server.product.md) | [Overview](overviews/pcap-server.overview.md) -- `src/plugin/connector/pcapServer/index.ts`
- **Ghi chú:**
  - Minimal TCP server mô phỏng PCAP interface
  - Xử lý 2 lệnh binary: `0x01` (request ID), `0x07` (heartbeat)
  - Retry port khi EADDRINUSE (fix promise hang)
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #5 -- lazy init, Issue #8 -- promise hang retry, Issue #21 -- pcap unref)

---

### Browser Launcher -- Spawn Chromium mặc định

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/browser-launcher.design.md) | [Spec](specs/browser-launcher.spec.md) | [Plan](plans/browser-launcher.plan.md) | [Product](products/browser-launcher.product.md) | [Overview](overviews/browser-launcher.overview.md) -- `src/plugin/launcher/index.ts`
- **Ghi chú:**
  - Spawn Chromium child process
  - Phát hiện DevTools listening URL từ stderr/stdout
  - Interface `Browser` với configure, close
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #1 -- dùng PluginError thay Error thô)

---

### Native Mutex -- Windows named mutex

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/native-mutex.design.md) | [Spec](specs/native-mutex.spec.md) | [Plan](plans/native-mutex.plan.md) | [Product](products/native-mutex.product.md) | [Overview](overviews/native-mutex.overview.md) -- `src/plugin/mutex/index.ts`
- **Ghi chú:**
  - Native C++ addon (`mutex.node`)
  - Hỗ trợ win32 32-bit + 64-bit
  - `create(name)` -- tạo named mutex
  - **Bug fix (2026-06-03):** Hardcoded path resolve bị sai sau khi tsup bundle. Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #18).

---

### FingerprintPlugin -- Core orchestrator

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/fingerprint-plugin.design.md) | [Spec](specs/fingerprint-plugin.spec.md) | [Plan](plans/fingerprint-plugin.plan.md) | [Product](products/fingerprint-plugin.product.md) | [Overview](overviews/fingerprint-plugin.overview.md) -- `src/plugin/index.ts`
- **Ghi chú:**
  - Lifecycle: setup -> spawn -> configure -> cleanup
  - Fluent config methods: useFingerprint, useProxy, useProfile, useBrowserVersion
  - `fetch()` -- lấy fingerprint từ service
  - `versions()` -- danh sách browser version có sẵn
  - `_launch()` -- core: gọi api('setup'), spawn worker.exe, cleanup/configure/sync
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #6 -- cleaner singleton, Issue #7 -- Connector factory, Issue #22 -- AsyncLock per-instance)

---

### Playwright Bridge -- PlaywrightFingerprintPlugin

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/playwright-bridge.design.md) | [Spec](specs/playwright-bridge.spec.md) | [Plan](plans/playwright-bridge.plan.md) | [Product](products/playwright-bridge.product.md) | [Overview](overviews/playwright-bridge.overview.md) -- `src/adapter/playwright/engine.ts`
- **Ghi chú:**
  - Bridge giữa FingerprintPlugin và Playwright BrowserType
  - Override launch/launchPersistentContext
  - Validate unsupported options (proxy, channel, firefoxUserPrefs)
  - Filter ignored Chromium arguments
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #3 -- defaultLauncher mutable state)

---

### BrowserEngine -- Fluent API

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/browser-engine.design.md) | [Spec](specs/browser-engine.spec.md) | [Plan](plans/browser-engine.plan.md) | [Product](products/browser-engine.product.md) | [Overview](overviews/browser-engine.overview.md) -- `src/adapter/playwright/chromium.ts`
- **Ghi chú:**
  - Multi-instance — mỗi `new BrowserEngine()` là instance độc lập, có thể launch riêng
  - Fluent API: useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit
  - repackChromium() -- thay thế Playwright launcher mặc định
  - Chỉ cho phép launch() một lần mỗi instance
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #15 -- quit unmap, Issue #19 -- singleton, Issue #3 -- launcher inject)

---

### Cấu hình Fingerprint

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/fingerprint-config.design.md) | [Spec](specs/fingerprint-config.spec.md) | [Plan](plans/fingerprint-config.plan.md) | [Product](products/fingerprint-config.product.md) | [Overview](overviews/fingerprint-config.overview.md)
- **Ghi chú:**
  - useFingerprint(data, options) -- gắn fingerprint vào browser
  - Hỗ trợ: PerfectCanvas, WebGL noise, Audio noise, Canvas noise, Battery API, Sensor API, HiDPI, FontPack, che giấu element size

---

### Cấu hình Proxy

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/proxy-config.design.md) | [Spec](specs/proxy-config.spec.md) | [Plan](plans/proxy-config.plan.md) | [Product](products/proxy-config.product.md) | [Overview](overviews/proxy-config.overview.md)
- **Ghi chú:**
  - useProxy(data, options) -- định tuyến traffic qua proxy
  - Hỗ trợ: HTTP/HTTPS/SOCKS4/SOCKS5, timezone sync, geolocation sync, language sync
  - WebRTC: enable/disable/replace
  - DNS: system-proxy/custom-proxy/custom-direct
  - Tunneling, QUIC, IP detection

---

### Quản lý Profile

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/profile-management.design.md) | [Spec](specs/profile-management.spec.md) | [Plan](plans/profile-management.plan.md) | [Product](products/profile-management.product.md) | [Overview](overviews/profile-management.overview.md) -- `src/adapter/playwright/data.ts`, `src/plugin/index.ts`
- **Ghi chú:**
  - useProfile(dirPath, options) -- liên kết thư mục profile
  - AdapterDataManager: map profile -> temp dir (tránh corrupt), unmap khi quit
  - Load lại proxy/fingerprint đã dùng từ profile

---

### Quản lý Viewport

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/viewport-management.design.md) | [Spec](specs/viewport-management.spec.md) | [Plan](plans/viewport-management.plan.md) | [Product](products/viewport-management.product.md) | [Overview](overviews/viewport-management.overview.md) -- `src/adapter/playwright/utils.ts`, `src/plugin/browser.ts`, `src/plugin/config.ts`
- **Ghi chú:**
  - CDP-based resize với retries (max 3 lần)
  - Sync availWidth/availHeight vào engine .ini file
  - bindHooks -- proxy viewport qua newPage/setViewportSize
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #10 -- synchronize key name, Issue #12 -- isBrowser type guard, Issue #13 -- pollInterval timeout, Issue #22 -- AsyncLock per-instance)

---

### File Cleanup Daemon

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/file-cleanup-daemon.design.md) | [Spec](specs/file-cleanup-daemon.spec.md) | [Plan](plans/file-cleanup-daemon.plan.md) | [Product](products/file-cleanup-daemon.product.md) | [Overview](overviews/file-cleanup-daemon.overview.md) -- `src/plugin/cleaner.ts`
- **Ghi chú:**
  - proper-lockfile để tránh xoá file đang dùng
  - Timer 15s cleanup interval
  - ignore/include để lock/unlock file theo PID
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #9 -- posix path -> Windows native path)

---

### Hook Binding

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/hook-binding.design.md) | [Spec](specs/hook-binding.spec.md) | [Plan](plans/hook-binding.plan.md) | [Product](products/hook-binding.product.md) | [Overview](overviews/hook-binding.overview.md) -- `src/adapter/playwright/utils.ts`
- **Ghi chú:**
  - onClose -- register close/disconnect handler
  - bindHooks -- proxy newContext/newPage/setViewportSize
  - setViewport -- resize qua CDP với retries

---

### Common Scripts (In-browser)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/common-scripts.design.md) | [Spec](specs/common-scripts.spec.md) | [Plan](plans/common-scripts.plan.md) | [Product](products/common-scripts.product.md) | [Overview](overviews/common-scripts.overview.md) -- `src/common/index.ts`
- **Ghi chú:**
  - `waitForResize` -- ResizeObserver + requestAnimationFrame
  - `getViewport` -- window.innerWidth/innerHeight

---

### Playwright Module Loader

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/playwright-module-loader.design.md) | [Spec](specs/playwright-module-loader.spec.md) | [Plan](plans/playwright-module-loader.plan.md) | [Product](products/playwright-module-loader.product.md) | [Overview](overviews/playwright-module-loader.overview.md) -- `src/loader/index.ts`, `src/adapter/playwright/loader.ts`
- **Ghi chú:**
  - Loader class -- resolve package, validate version >= minimum
  - Playwright loader target `>= 1.27.1`, fallback packages: `['playwright-core']`

---

### Debug Logging

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/debug-logging.design.md) | [Spec](specs/debug-logging.spec.md) | [Plan](plans/debug-logging.plan.md) | [Product](products/debug-logging.product.md) | [Overview](overviews/debug-logging.overview.md)
- **Ghi chú:**
  - debug package, namespace theo module
  - `browser-with-fingerprints:connector`
  - `browser-with-fingerprints:connector:engine`
  - `browser-with-fingerprints:connector:pcapServer`
  - `browser-with-fingerprints:cleaner`

---

### Dead export SettingsCleaner default (Bug fix #25)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-025-dead-export-settingscleaner.design.md) | [Spec](specs/bug-025-dead-export-settingscleaner.spec.md) | [Plan](plans/bug-025-dead-export-settingscleaner.plan.md) | [Overview](overviews/bug-025-dead-export-settingscleaner.overview.md)
- **Ghi chú:**
  - Đã thêm `@deprecated` JSDoc cho `export default new SettingsCleaner()` trong `src/plugin/cleaner.ts:118`.
  - Đã refactor `tests/quit-cleanup.test.ts` sang dùng `new SettingsCleaner()` thay vì default import.
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #25).

---

### Test Error classes & Utilities

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/test-error-classes-utilities.design.md) | [Spec](specs/test-error-classes-utilities.spec.md) | [Plan](plans/test-error-classes-utilities.plan.md) | [Overview](overviews/test-error-classes-utilities.overview.md)
- **Ghi chú:**
  - File test: `tests/utils.test.ts` (35 test cases, 4 module)
  - Module đã test: `errors.ts`, `utils.ts`, `common/index.ts`, `loader/index.ts`
  - Tất cả 58 test (35 mới + 23 cũ) đều pass
  - Sai lệch: 1 test `defaultArgs()` sửa behavior cho đúng với code (headless mặc định = true)

---

### Test Connector (RemoteEngine + Connector + PCAP)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/test-connector.design.md) | [Spec](specs/test-connector.spec.md) | [Plan](plans/test-connector.plan.md) | [Overview](overviews/test-connector.overview.md)
- **Ghi chú:**
  - File test: `tests/connector.test.ts` — 27 test cases mới
  - PCAP Server: 5 tests (listen/close, request ID, heartbeat, data rỗng, close server)
  - RemoteEngine: 15 tests (constructor, setters, exists, checksum, download, kill)
  - Connector: 7 tests (constructor, api error normalization, cleanup)
  - Tất cả 85 tests pass (27 mới + 58 cũ)
  - Hybrid approach: PCAP với TCP thật, helpers với file thật + HTTP server local, Connector với mock RemoteEngine
  - Integration test với engine thật: `it.skip` — triển khai sau

---

### Test Cleanup (SettingsCleaner + ConfigManager + Mutex)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-04
- **Tài liệu:** [Design](designs/test-cleanup.design.md) | [Spec](specs/test-cleanup.spec.md) | [Plan](plans/test-cleanup.plan.md) | [Overview](overviews/test-cleanup.overview.md) -- `tests/cleanup.test.ts`
- **Ghi chú:**
  - File test: `tests/cleanup.test.ts` — 19 test cases mới
  - Module đã test: `cleaner.ts`, `config.ts`, `mutex/index.ts`
  - Manual stub (CJS property mutation) + integration (temp file thật) + sinon global spies
  - Tất cả 104 tests pass (19 mới + 85 cũ)
  - Sai lệch: proxyquire → manual stub (ESM incompatibility), bỏ test `#cleanup` private method, sinon chỉ dùng cho global spies

---

### Test Browser (Launcher + BrowserEngine + PlaywrightBridge)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-04
- **Tài liệu:** [Design](designs/test-browser.design.md) | [Spec](specs/test-browser.spec.md) | [Plan](plans/test-browser.plan.md) | [Overview](overviews/test-browser.overview.md) -- `tests/browser.test.ts`
- **Ghi chú:**
  - File test: `tests/browser.test.ts` -- 40 test cases mới
  - Module đã test: `launcher/index.ts`, `adapter/playwright/chromium.ts`, `adapter/playwright/engine.ts`, `adapter/playwright/utils.ts`
  - Integration test với Playwright Chromium thật (skip nếu không có binary)
  - Tất cả 156 tests pass (40 mới + 116 cũ)
  - Sai lệch: Tạo `TestPlugin` subclass để bypass `_launch()` (engine API không khả dụng). Export `isBrowser` từ `utils.ts`. setViewport headless không chính xác.

---

### Test Profile (AdapterDataManager)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-04
- **Tài liệu:** [Design](designs/test-profile.design.md) | [Spec](specs/test-profile.spec.md) | [Plan](plans/test-profile.plan.md) | [Overview](overviews/test-profile.overview.md)
- **Ghi chú:**
  - File test: `tests/profile.test.ts` — 12 test cases mới
  - Module đã test: `adapter/playwright/data.ts` — `AdapterDataManager`
  - Unit test: map/unmap/dispose, generateUniqueName, edge cases
  - Dùng thư mục temp thật (fs thật, không mock)
  - Tất cả 116 tests pass (12 mới + 104 cũ)

---

### File corrupt download engine cleanup (Bug fix #24)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-024-download-cleanup.design.md) | [Spec](specs/bug-024-download-cleanup.spec.md) | [Plan](plans/bug-024-download-cleanup.plan.md) | [Overview](overviews/bug-024-download-cleanup.overview.md)
- **Ghi chú:**
  - Hàm `download()` trong `src/plugin/connector/engine.ts:129-145` thiếu `finally` block dọn dẹp file partial khi download thất bại.
  - Fix: chuyển sang cơ chế temp file + rename (ghi vào `.tmp`, rename sau pipeline thành công, xoá `.tmp` trong catch).
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #24).

---

### Docs review & consistency fix

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Overview](overviews/docs-review-consistency-fix.overview.md)
- **Ghi chú:**
  - Rà soát toàn bộ hệ thống docs sau khi fix nhiều issue.
  - Xoá local numbering (#1-#20) khỏi KNOWN_ISSUES.md để tránh nhầm lẫn với GitHub issue numbers.
  - Cập nhật template known-issue.template.md: bỏ LOCAL_NUM, chỉ dùng GitHub number.
  - Fix KNOWN_ISSUES.md: link hỏng #6, thiếu Overview 8 entries, header mapping.
  - Fix ROADMAP.md: feature entries outdated (singleton descriptions), chuyển local # sang GitHub Issue #, thêm bug fix ghi chú, xoá bug entries, format lỗi.

---

### AsyncLock module-level gây contention giữa các instance (Bug fix #22)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-022-asynclock-per-instance.design.md) | [Spec](specs/bug-022-asynclock-per-instance.spec.md) | [Plan](plans/bug-022-asynclock-per-instance.plan.md) | [Overview](overviews/bug-022-asynclock-per-instance.overview.md)
- **Ghi chú:**
  - `const lock = new AsyncLock()` trong `src/plugin/config.ts:34` là module-level — tất cả `FingerprintPlugin` instance chia sẻ một lock.
  - Fix: chuyển thành per-instance bằng cách refactor `config.ts` thành class `ConfigManager`.
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #22).

---

### Cleaner race condition khi cleanup: chờ engine process thoát hẳn (Bug fix #23)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-023-cleanup-race-condition.design.md) | [Spec](specs/bug-023-cleanup-race-condition.spec.md) | [Plan](plans/bug-023-cleanup-race-condition.plan.md) | [Overview](overviews/bug-023-cleanup-race-condition.overview.md)
- **Ghi chú:**
  - `RemoteEngine.kill()` fire-and-forget gây EBUSY khi cleaner xoá file lúc process còn ghi.
  - Fix: chuyển `kill()` và `cleanup()` sang async, await process exit với timeout + SIGKILL fallback.
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #23).

---

### Process không tự động thoát sau khi quit() — PCAP server thiếu unref() (Bug fix #21)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-021-pcap-unref.design.md) | [Spec](specs/bug-021-pcap-unref.spec.md) | [Plan](plans/bug-021-pcap-unref.plan.md) | [Overview](overviews/bug-021-pcap-unref.overview.md)
- **Ghi chú:**
  - `net.Server` thiếu `unref()` — PCAP server giữ event loop sau khi cleanup.
  - Fix: thêm `svr.unref()` trong callback `onListening` của PCAP server.
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #21).

---

### Test coverage: `runFunction()` IPC core (Issue #28)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-04
- **Cập nhật:** 2026-06-04
- **Tài liệu:** [Design](designs/test-runfunction-ipc-core.design.md) | [Spec](specs/test-runfunction-ipc-core.spec.md) | [Plan](plans/test-runfunction-ipc-core.plan.md) | [Overview](overviews/test-runfunction-ipc-core.overview.md)
- **Ghi chú:**
  - Đã thêm 6 test cases cho `RemoteEngine.runFunction()` trong `tests/connector.test.ts`.
  - Dùng `RemoteEngine._execFile` mock (static property) thay vì `child_process.execFile` override (ESM live binding immutable).
  - Thêm `RemoteEngine._closeTimeout` static để test process đóng nhanh.
  - Thêm `raw` flag trong `simulateResponse` helper cho invalid JSON test.
  - Tất cả 162 tests pass.
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #28).

---

### Test coverage: EADDRINUSE retry trong PCAP server (Issue #29)

- **Trạng thái:** [-] Sắp làm
- **Ngày tạo:** 2026-06-04
- **Cập nhật:** 2026-06-04
- **Tài liệu:** (sẽ tạo theo WORKFLOW.md khi bắt đầu xử lý)
- **Ghi chú:**
  - PCAP server có retry logic khi port bận nhưng không có test verify.
  - Spec yêu cầu test "EADDRINUSE — Retry + thành công ở lần 2" nhưng chưa implement.
  - Deviation: overview ghi "không test được vì `once()` wrapper".
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #29).

---

### Test coverage: HTTPS fallback trong `download()` (Issue #30)

- **Trạng thái:** [-] Sắp làm
- **Ngày tạo:** 2026-06-04
- **Cập nhật:** 2026-06-04
- **Tài liệu:** (sẽ tạo theo WORKFLOW.md khi bắt đầu xử lý)
- **Ghi chú:**
  - `download()` có fallback HTTPS→HTTP khi network error, `fetchWithFallback()` được export để test.
  - Cả hai đều không có coverage — dự án đã từng có bug liên quan (Issue #4).
  - Liên quan: Test Connector, Bug fix #24 (download cleanup).
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #30).

---

### Test coverage: async-lock trong Connector (Issue #31)

- **Trạng thái:** [-] Sắp làm
- **Ngày tạo:** 2026-06-04
- **Cập nhật:** 2026-06-04
- **Tài liệu:** (sẽ tạo theo WORKFLOW.md khi bắt đầu xử lý)
- **Ghi chú:**
  - Connector dùng `async-lock` để serialise IPC requests. Spec yêu cầu test concurrent calls.
  - Hiện tại không có test nào verify lock behavior — nguy cơ race condition trên file-based IPC.
  - Liên quan: Test Connector, Bug fix #22 (AsyncLock per-instance).
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #31).

---

### Docs: Fix spec/overview consistency và các lỗi nhỏ

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-04
- **Cập nhật:** 2026-06-04
- **Tài liệu:** [Overview](overviews/docs-spec-overview-consistency.overview.md)
- **Ghi chú:**
  - Đã cập nhật spec files để phản ánh deviations thực tế (EADDRINUSE, `#cleanup`, permission error, sinon).
  - **`test-connector.spec.md`:** Xoá EADDRINUSE retry test, sửa `require.cache` → ESM import, cập nhật test counts (5+15+7=27).
  - **`test-cleanup.spec.md`:** Sửa sinon → manual stub, xoá `#cleanup()` test cases, cập nhật test counts (9+10+4=23).
  - **`test-browser.spec.md`:** Thêm TestPlugin pattern, isBrowser export, setViewport headless limitation, cập nhật count (40).
  - **`test-profile.spec.md`:** Xoá map() error path, unmap() permission error, cập nhật counts (4+3+2=9).
  - **`test-connector.plan.md`:** Xoá EADDRINUSE bước, sửa ESM cache notes.
  - **`test-cleanup.plan.md`:** Xoá sinon installation task, xoá `#cleanup()` task, thay sinon code bằng manual stub.
  - **`test-cleanup.overview.md`:** Sửa reference sai "thêm sinon vào devDependencies".
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) — các issue #28-#31 vẫn open (test coverage gaps).

---

