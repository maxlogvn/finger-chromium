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
  - **Docs correction (2026-06-04):** Da bo sung giai thich "tai sao" cho `dedent`, `captureStackTrace`, `Symbol.toStringTag`; them chi tiet message tung class vao spec/product; fix overview sai "3 dong".

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
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #5 -- lazy init, Issue #8 -- promise hang retry)

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
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #6 -- cleaner singleton, Issue #7 -- Connector factory)

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
  - Bug fix — xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) (Issue #10 -- synchronize key name, Issue #12 -- isBrowser type guard, Issue #13 -- pollInterval timeout)

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

### Tăng test coverage cho core modules

- **Trạng thái:** [-] Sắp làm
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:**
- **Ghi chú:**
  - Hiện chỉ có 2 file test: `multi-profile-singleton.test.ts` và `quit-cleanup.test.ts`
  - Cần unit test cho: `RemoteEngine` (engine.ts), `Connector` (connector/index.ts), `PCAPServer`, `Cleaner`
  - Test với browser thật (theo CONVENTIONS.md) nhưng cần thêm test cho logic xử lý lỗi và edge cases
  - Mục tiêu: coverage tối thiểu 60% cho `src/plugin/` và `src/adapter/`

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

