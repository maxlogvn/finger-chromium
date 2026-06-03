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
  - `npm run clean` -- xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) #5 (fix Windows compatibility)

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
  - Singleton RemoteEngine với async-lock đồng bộ
  - `api(name, params)` -- wrapper error normalization
  - Auto-start PCAP server
  - **Bug fix (2026-06-03):** Cache engine process giữa các API calls — tránh spawn `FastExecuteScript.exe` mới mỗi lần. Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) #18.

---

### PCAP Server -- Mock TCP server

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/pcap-server.design.md) | [Spec](specs/pcap-server.spec.md) | [Plan](plans/pcap-server.plan.md) | [Product](products/pcap-server.product.md) | [Overview](overviews/pcap-server.overview.md) -- `src/plugin/connector/pcapServer/index.ts`
- **Ghi chú:**
  - Minimal TCP server mô phỏng PCAP interface
  - Xử lý 2 lệnh binary: `0x01` (request ID), `0x07` (heartbeat)
  - Retry port khi EADDRINUSE

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
  - **Bug fix (2026-06-03):** Hardcoded path resolve bị sai sau khi tsup bundle. Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) #6.

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

---

### BrowserEngine -- Fluent API

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** [Design](designs/browser-engine.design.md) | [Spec](specs/browser-engine.spec.md) | [Plan](plans/browser-engine.plan.md) | [Product](products/browser-engine.product.md) | [Overview](overviews/browser-engine.overview.md) -- `src/adapter/playwright/chromium.ts`
- **Ghi chú:**
  - Singleton `Chromium` instance
  - Fluent API: useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit
  - repackChromium() -- thay thế Playwright launcher mặc định
  - Chỉ cho phép launch() một lần

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

### Bug #13 — Cleaner singleton dùng chung giữa các BrowserEngine instance

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-013-cleaner-singleton.design.md) | [Spec](specs/bug-013-cleaner-singleton.spec.md) | [Plan](plans/bug-013-cleaner-singleton.plan.md) | [Overview](overviews/bug-013-cleaner-singleton.overview.md)
- **Ghi chú:**
  - `export default new SettingsCleaner()` -- singleton global
  - Instance A cleanup file của instance B (race condition)
  - Fix: export class, mỗi FingerprintPlugin có cleaner riêng

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

### Bug #1 — `notify()` dead code

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-001-notify-dead-code.design.md) | [Spec](specs/bug-001-notify-dead-code.spec.md) | [Plan](plans/bug-001-notify-dead-code.plan.md) | [Overview](overviews/bug-001-notify-dead-code.overview.md)
- **Ghi chú:**
  - `notify()` trong `utils.ts` không được import bởi bất kỳ file nào
  - `notifyTimer` + `clearTimeout(notifyTimer)` trong `index.ts` là dead code
  - Cần quyết định: xoá hoặc tích hợp đúng luồng

---

---

### Bug #2 — Error classes không export trong public API

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-002-export-error-classes.design.md) | [Spec](specs/bug-002-export-error-classes.spec.md) | [Plan](plans/bug-002-export-error-classes.plan.md) | [Overview](overviews/bug-002-export-error-classes.overview.md)
- **Ghi chú:**
  - Fix: them export block 5 error class tu `./plugin/errors` vao `src/index.ts`
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) #2

---

### Bug #4 — JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-004-jsdoc-privatekey.design.md) | [Spec](specs/bug-004-jsdoc-privatekey.spec.md) | [Plan](plans/bug-004-jsdoc-privatekey.plan.md) | [Overview](overviews/bug-004-jsdoc-privatekey.overview.md)
- **Ghi chú:**
  - Fix: xoá `usePrivateKey()` khỏi JSDoc, thay bằng hướng dẫn set env `BABLOSOFT_KEY`
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) #4

---

### Bug #3 — `quit()` xoá toàn bộ `BROWSER_RUNNING_DIR` thay vì chỉ xoá temp dir của instance

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-003-quit-unmap-root.design.md) | [Spec](specs/bug-003-quit-unmap-root.spec.md) | [Plan](plans/bug-003-quit-unmap-root.plan.md) | [Overview](overviews/bug-003-quit-unmap-root.overview.md)
- **Ghi chú:**
  - `this.dataManager.unmap(BROWSER_RUNNING_DIR)` trong `quit()` xoá cả thư mục gốc `.tmp/browser/running/`
  - Fix: đổi thành `this.dataManager.dispose()` — chỉ xoá temp dir của instance hiện tại
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) #3

---

### Bug #7 — Singleton `Chromium` không hỗ trợ launch nhiều profile song song

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-007-multi-profile-singleton.design.md) | [Spec](specs/bug-007-multi-profile-singleton.spec.md) | [Plan](plans/bug-007-multi-profile-singleton.plan.md) | [Overview](overviews/bug-007-multi-profile-singleton.overview.md)
- **Ghi chú:**
  - `BrowserEngine` là singleton — `launch()` chỉ cho phép gọi một lần
  - Test `multi_context.ts` gọi launch cho 2 profile khác nhau trên cùng instance, lỗi "Phuong thuc launch() chi duoc goi mot lan."
  - Nguyên nhân gốc: design singleton không phù hợp với use case multi-profile

---

---

### Bug #11 — `defaultLauncher` mutable state gây khó unit test

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-03
- **Cập nhật:** 2026-06-03
- **Tài liệu:** [Design](designs/bug-011-default-launcher.design.md) | [Spec](specs/bug-011-default-launcher.spec.md) | [Plan](plans/bug-011-default-launcher.plan.md) | [Overview](overviews/bug-011-default-launcher.overview.md)**
- **Ghi chú:**
  - `browserType` load ở module scope, `defaultLauncher` là shared mutable state
  - Fix: factory function + inject launcher qua `BrowserEngine` constructor
  - Xem [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) #11

---

<!-- Hết feature tasks -- các non-feature tasks (format code, fix quit, build config, known issues, documentation rewrite/correction) đã được dọn khỏi roadmap vì đã hoàn thành và không cần theo dõi tiến độ. -->

