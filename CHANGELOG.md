# Changelog

Tất cả thay đổi đáng chú ý của dự án `fingerprint-chromium-engine` sẽ được ghi lại tại file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này sử dụng [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - Chưa phát hành

### Added

- **Fingerprint Storage**: Hệ thống lưu trữ và quản lý fingerprint cục bộ.
  - Tự động đồng bộ fingerprint mới sau mỗi lần tạo.
  - Cache fingerprint theo tags để tái sử dụng, tránh tạo mới mỗi lần.
  - API `listFingerprints()`, `getFingerprint(id)`, `deleteFingerprint(id)`.
  - Tích hợp với `BrowserEngine.useFingerprint()` để tự động tra cứu cache trước khi tạo mới.
  - Lưu trữ an toàn, hỗ trợ mã hoá dữ liệu nhạy cảm.

---

## [1.0.1] - 2026-06-09

### Added

- **Unit tests cho các module còn thiếu**:
  - `src/plugin/cleaner.ts`: Test SettingsCleaner vòng đời, lock xuyên tiến trình, khoảng thời gian dọn dẹp.
  - `src/adapter/playwright/bridge.ts`: Test bridge pattern, hook binding, lan truyền lỗi.
  - `src/adapter/playwright/data.ts`: Test DataManager lưu trữ, bộ nhớ đệm, mã hoá.
  - `src/plugin/mutex/index.ts`: Test Windows named mutex acquire/release.
  - `src/plugin/index.ts`: Test plugin exports và khởi tạo.
  - `src/index.ts`: Test entry point và re-exports.
- **Integration tests**: `tests/integration/` test luồng thực tế engine thật + Playwright không mock.
- **Snapshot tests**: `defaultArgs` snapshot cho utils.test.ts.

### Changed

- **Chuẩn hoá mock paths**: Chuyển relative paths (`../../../../src/`) sang `@src/` alias trong toàn bộ unit tests.
- **Tách helpers chung**: Tạo `tests/helpers/` directory để tái sử dụng mock setup, giảm code trùng lặp.
- **Sửa tên file**: `tests/e2e/lauch.spec.ts` -> `tests/e2e/launch.spec.ts`.

### Fixed

- **Typo tên file**: `lauch.spec.ts` thiếu chữ `n` -> `launch.spec.ts`.
- **Type safety**: Thay `as any` casts trong test mocks bằng type definitions chính xác.
- **Branch coverage**: Tăng branch coverage `src/plugin/` từ 46% lên >70%.

---

## [1.0.0] - 2026-06-08

### Added

- **Fluent API** (`BrowserEngine`): Method chaining `useFingerprint().useProxy().useProfile().launch()`.
- **PlaywrightFingerprintPlugin**: Bridge pattern giữa BAS engine và Playwright.
  - Hỗ trợ `launchPersistentContext` và `newContext` với fingerprint đã được inject.
- **Viewport Management**: Set viewport chính xác qua CDP `Browser.setWindowBounds` với:
  - Delta adjustment sau mỗi lần thử sai.
  - Fallback sang `page.setViewportSize()` trong headless mode (#36).
- **PCAP Mock Server**: TCP server tối giản đáp ứng dependency của BAS engine mà không cần PCAP thật.
- **Native Mutex**: Windows named mutex (`CreateMutex` Win32 API) cho win32-x64 và win32-ia32.
- **SettingsCleaner**: Dọn dẹp file tạm BAS engine (`*.ini`, `t/*`) với:
  - Lock cross-process qua `proper-lockfile`.
  - Cleaner interval 15s, chỉ xoá file > 15s tuổi.
- **ConfigManager**: Đồng bộ viewport settings giữa BAS engine và thực tế.
- **Browser Launcher**: Spawn Chromium process với tuỳ chỉnh arguments, kill process tree (`taskkill /T /F`).
- **Hàng loạt tính năng anti-detection**:
  - PerfectCanvas
  - FontPack
  - WebGL, WebRTC, AudioContext fingerprint
  - Timezone, Geolocation đồng bộ theo proxy
- **Integration test core flow**: `launch -> newContext -> quit` với MockConnector + mock launcher (#47).

### Changed

- **Kiến trúc**: Chuyển từ singleton `Chromium` sang instance-based `BrowserEngine` (#7).
  - `Chromium` được giữ lại làm alias cho backward compatibility.
- **RemoteEngine**: Từ singleton global thành per-instance thông qua `Connector` class (#14).
  - Cache engine process (#18): tái sử dụng `FastExecuteScript.exe` thay vì spawn mới.
- **SettingsCleaner**: Từ singleton thành instance, thêm `class SettingsCleaner` export (#13).
- **PCAP Server**: Chuyển từ module-scoped listen sang lazy init trong `api()` (#12).
- **Error handling**: Tất cả `throw Error` được thay bằng `throw PluginError` và subclass.
- **Download engine**: Thêm cơ chế temp file + rename để tránh file corrupt (#24).
- **ESLint**: Nâng cấp lên `strictTypeChecked`, xoá `as any` khỏi toàn bộ codebase.
- **Viewport retry**: Giảm `setTimeout(2000)` xuống `500ms` + thêm `pollInterval` param (#20).
- **isBrowser()**: Kiểm tra 3 properties (isConnected + contexts + version) thay vì chỉ version (#19).

### Fixed

- (#21): Thêm `svr.unref()` cho PCAP server để process tự động thoát sau `quit()`.
- (#22): Chuyển AsyncLock từ module-level sang per-instance trong ConfigManager.
- (#23): Cleaner race condition khi cleanup - chờ engine process thoát hẳn trước khi unlock.
- (#24): File .zip corrupt khi download thất bại - thêm temp file + rename.
- (#25): Thêm `@deprecated` JSDoc cho SettingsCleaner default export.
- (#32): Chuyển `serviceKey` từ module scope thành `#serviceKey` private field.
- (#34): Chuyển static property `_execFile`/`_closeTimeout` sang Dependency Injection qua constructor.
- (#35): Tập trung timer API vào `src/common/timer.ts`, chuyển 4 module sang dùng chung.
- (#36): Fallback CDP `setWindowBounds` sang `page.setViewportSize()` trong headless mode.
- (#8): Đổi engine download URL từ HTTP sang HTTPS với fallback.
- (#10): Sửa import path sai trong `chromium.ts`.
- (#15): PCAP server retry EADDRINUSE nhưng promise gốc không resolve.
- (#9, #16, #17): PluginError thay Error, posix path sang node:path, fix key mapping.
- (#42): Xoá 40 link hỏng [Plan]/[Overview] trong ROADMAP.md.
- **Quit cleanup**: `quit()` dọn dẹp đầy đủ handles (worker.exe, engine process, PCAP, cleaner, mutex).
- **ESLint**: Sửa 96 lỗi strictTypeChecked về type safety, error handling, code style.

### Docs

- Viết lại toàn bộ tài liệu docs/ bằng tiếng Việt (103 files, 21 features).
- Thêm STACK.md giải thích lý do chọn từng package.
- Thêm CONVENTIONS.md ghi rõ coding standards.
- Thêm engine-architecture.md mô tả kiến trúc BAS engine và cơ chế inject fingerprint.
- Thêm KNOWN_ISSUES.md, WORKFLOW.md, template files cho quy trình phát triển.

---

## [0.1.0] - 2026-06-02

### Added

- **Khởi tạo dự án**: Cấu trúc thư mục, build config (tsup ESM + CJS).
- **Hệ thống kiểu (Type System)**: `PWChromium.ts`, `fingerprint.ts`, `proxy.ts`, `profile.ts`, `fetch.ts`.
- **Hệ thống lỗi (Error Classes)**:
  - `PluginError` (base), `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`.
- **RemoteEngine**: Giao tiếp với BAS engine binary qua file-based IPC (chokidar).
  - `runFunction()` - invoke function trên engine C++.
  - `download()` - tải engine ZIP từ GitHub (Bablosoft).
  - Grace timeout 30s cho GitHub CDN (stream không bao giờ kết thúc).
- **API Connector**: Lớp `Connector` làm cầu nối API giữa Node.js và BAS engine.
- **PCAP Server**: TCP server mock để BAS engine khỏi báo lỗi thiếu PCAP.
- **Browser Launcher**: Spawn Chromium, kill process tree, tuỳ chỉnh arguments.
- **FingerprintPlugin**: Lớp core quản lý fingerprint, proxy, profile setup.
- **Playwright Bridge**: Tích hợp với Playwright `BrowserType.launch()`.
- **Cấu hình Fingerprint**: `useFingerprint()`, `newFingerprint()`, tags, time limit.
- **Cấu hình Proxy**: `useProxy()` đồng bộ timezone, geolocation, WebRTC, DNS.
- **Quản lý Profile**: `useProfile()` lưu/tải cookie, localStorage, session.
- **Dynamic Loader**: Load Playwright tại runtime, fallback `playwright` -> `playwright-core`.
- **Hook Binding**: Proxy `newContext()`/`newPage()`/`setViewportSize()` để lock viewport sau fingerprint.

[1.0.1]: https://github.com/maxlogvn/finger-chromium/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/maxlogvn/finger-chromium/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/maxlogvn/finger-chromium/releases/tag/v0.1.0
