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
- **Ghi chú:**
  - TypeScript strict mode, target ES2022
  - tsup bundle (ESM + CJS)
  - ESLint + Prettier (tabs, single quotes, 100 printWidth, no trailingComma)
  - Mocha test runner + tsx loader
  - dotenv, jiti cho dev
  - package.json đầy đủ scripts (lint, test, build, dev, format)

---

### Hệ thống kiểu (Type System)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/types/`
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
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/plugin/errors.ts`
- **Ghi chú:**
  - `PluginError` -- base class
  - `MissingKeyError` -- thiếu key bảo mật
  - `InvalidEngineError` -- engine chưa tải/giải nén
  - `EngineTimeoutError` -- timeout khởi động engine
  - `RequestTimeoutError` -- timeout request

---

### RemoteEngine -- Tải, giải nén và IPC với engine binary

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/plugin/connector/engine.ts`
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
- **Tài liệu:** `src/plugin/connector/index.ts`
- **Ghi chú:**
  - Singleton RemoteEngine với async-lock đồng bộ
  - `api(name, params)` -- wrapper error normalization
  - Auto-start PCAP server

---

### PCAP Server -- Mock TCP server

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/plugin/connector/pcapServer/index.ts`
- **Ghi chú:**
  - Minimal TCP server mô phỏng PCAP interface
  - Xử lý 2 lệnh binary: `0x01` (request ID), `0x07` (heartbeat)
  - Retry port khi EADDRINUSE

---

### Browser Launcher -- Spawn Chromium mặc định

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/plugin/launcher/index.ts`
- **Ghi chú:**
  - Spawn Chromium child process
  - Phát hiện DevTools listening URL từ stderr/stdout
  - Interface `Browser` với configure, close

---

### Native Mutex -- Windows named mutex

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/plugin/mutex/index.ts`
- **Ghi chú:**
  - Native C++ addon (`mutex.node`)
  - Hỗ trợ win32 32-bit + 64-bit
  - `create(name)` -- tạo named mutex

---

### FingerprintPlugin -- Core orchestrator

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/plugin/index.ts`
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
- **Tài liệu:** `src/adapter/playwright/engine.ts`
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
- **Tài liệu:** `src/adapter/playwright/chromium.ts`
- **Ghi chú:**
  - Singleton `Chromium` instance
  - Fluent API: usePrivateKey -> useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit
  - repackChromium() -- thay thế Playwright launcher mặc định
  - Chỉ cho phép launch() một lần

---

### Cấu hình Fingerprint

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Ghi chú:**
  - useFingerprint(data, options) -- gắn fingerprint vào browser
  - Hỗ trợ: PerfectCanvas, WebGL noise, Audio noise, Canvas noise, Battery API, Sensor API, HiDPI, FontPack, che giấu element size

---

### Cấu hình Proxy

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
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
- **Tài liệu:** `src/adapter/playwright/data.ts`, `src/plugin/index.ts`
- **Ghi chú:**
  - useProfile(dirPath, options) -- liên kết thư mục profile
  - AdapterDataManager: map profile -> temp dir (tránh corrupt), unmap khi quit
  - Load lại proxy/fingerprint đã dùng từ profile

---

### Quản lý Viewport

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/adapter/playwright/utils.ts`, `src/plugin/browser.ts`, `src/plugin/config.ts`
- **Ghi chú:**
  - CDP-based resize với retries (max 3 lần)
  - Sync availWidth/availHeight vào engine .ini file
  - bindHooks -- proxy viewport qua newPage/setViewportSize

---

### File Cleanup Daemon

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/plugin/cleaner.ts`
- **Ghi chú:**
  - proper-lockfile để tránh xoá file đang dùng
  - Timer 15s cleanup interval
  - ignore/include để lock/unlock file theo PID

---

### Hook Binding

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/adapter/playwright/utils.ts`
- **Ghi chú:**
  - onClose -- register close/disconnect handler
  - bindHooks -- proxy newContext/newPage/setViewportSize
  - setViewport -- resize qua CDP với retries

---

### Common Scripts (In-browser)

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/common/index.ts`
- **Ghi chú:**
  - `waitForResize` -- ResizeObserver + requestAnimationFrame
  - `getViewport` -- window.innerWidth/innerHeight

---

### Playwright Module Loader

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Tài liệu:** `src/loader/index.ts`, `src/adapter/playwright/loader.ts`
- **Ghi chú:**
  - Loader class -- resolve package, validate version >= minimum
  - Playwright loader target `>= 1.27.1`, fallback packages: `['playwright-core']`

---

### Debug Logging

- **Trạng thái:** [X] Hoàn thành
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Ghi chú:**
  - debug package, namespace theo module
  - `fingerprint:adapter`, `fingerprint:plugin`, `fingerprint:connector`

---



### Tài liệu tính năng (design, spec, plan, product, overview)

- **Trạng thái:** [ ] Backlog
- **Ngày tạo:** 2026-06-02
- **Cập nhật:** 2026-06-02
- **Ghi chú:**
  - Tất cả thư mục `docs/designs/`, `docs/specs/`, `docs/plans/`, `docs/products/`, `docs/overviews/` đang trống
  - Cần viết tài liệu cho từng tính năng theo WORKFLOW.md
