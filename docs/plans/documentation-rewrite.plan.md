# Plan: Viết lại toàn bộ tài liệu tính năng

> **Mục tiêu:** Viết lại 103 file tài liệu (design, spec, plan, product, overview) cho 20 features + 1 non-feature, dựa trên code thật, đảm bảo chính xác, dễ hiểu, thân thiện với developer.

> **Kiến trúc:** Với mỗi feature, đọc toàn bộ code liên quan -> phân tích API, luồng dữ liệu, lifecycle -> viết 5 file tài liệu từ code. Xử lý tuần tự theo thứ tự roadmap từ trên xuống dưới.

> **Tech Stack:** TypeScript, Markdown

---

## Quy trình chung cho mỗi feature

1. **Đọc code:** Xác định tất cả file source liên quan đến feature. Đọc kỹ để hiểu API, luồng, lifecycle, xử lý lỗi.
2. **Viết design.md:** Giải thích "tại sao" -- vấn đề, phương án, giải pháp chọn, luồng hoạt động tổng quát.
3. **Viết spec.md:** Mô tả kỹ thuật chi tiết -- API, interfaces, luồng dữ liệu, file liên quan, xử lý lỗi.
4. **Viết plan.md:** Ghi lại các bước đã thực hiện từ code (retrospective plan).
5. **Viết product.md:** Hướng dẫn sử dụng dễ đọc, có ví dụ code, lifecycle rules, API tóm tắt.
6. **Viết overview.md:** Báo cáo kết quả -- mục tiêu, kết quả, kiểm tra, sai lệch.
7. **Kiểm tra:** `npm run lint` đảm bảo không lỗi.

---

## Task 1: Project Infrastructure

**Files cần đọc:**
- `package.json` -- dependencies, scripts, exports, peerDependencies
- `tsconfig.json` -- strict mode, target ES2022, paths alias `@src/*`
- `tsup.config.ts` -- ESM + CJS, dts.resolve: false, external list, skipNodeModulesBundle
- `eslint.config.ts` -- typescript-eslint, consistent-type-imports
- `.prettierrc` -- tabs, single quotes, 100 printWidth, no trailingComma
- `.mocharc.yml` -- tsx loader, tests/**/*.ts, timeout 10s
- `src/index.ts` -- public exports
- `project.xml` -- file cấu hình engine

**Files sẽ viết (ghi đè):**
- `docs/designs/project-infrastructure.design.md`
- `docs/specs/project-infrastructure.spec.md`
- `docs/plans/project-infrastructure.plan.md`
- `docs/products/project-infrastructure.product.md`
- `docs/overviews/project-infrastructure.overview.md`

- [ ] **Bước 1: Đọc và phân tích code**
  - Đọc `package.json`: lưu ý `peerDependencies` có `playwright-core >=1.60.0`, `dependencies` có 11 packages, `devDependencies` có ESLint, Mocha, tsup, Prettier, TypeScript ~5.8.
  - Đọc `tsconfig.json`: strict mode, `moduleResolution: "Bundler"`, paths `@src/*`, exclude `tests/`.
  - Đọc `tsup.config.ts`: entry `src/index.ts`, format `['cjs','esm']`, external 14 packages, `dts.resolve: false`, `skipNodeModulesBundle: true`, `minify: true`, `treeshake: true`.
  - Đọc `eslint.config.ts`: dùng `typescript-eslint`, `consistent-type-imports`, `no-explicit-any` là warn.
  - Đọc `.prettierrc`: `@cheshire-caat/prettier-config`, tabs, single quotes, trailingComma all.
  - Đọc `.mocharc.yml`: spec `tests/**/*.ts`, tsx loader.
  - Đọc `src/index.ts`: export Chromium + PWChromium + các type helper từ `adapter/playwright/chromium.ts`.
  - Đọc `project.xml`: file XML cho engine BAS, chứa `<EngineVersion>`.

- [ ] **Bước 2: Viết design.md**
  - Cấu trúc: Vấn đề -> Giải pháp -> Build pipeline -> External dependencies -> Chiến lược test -> Xử lý Windows
  - Nội dung chính: giải thích vì sao dùng tsup thay vì tsc, vì sao `dts.resolve: false`, vì sao để playwright-core là peer dependency, vì sao dùng browser thật cho test.

- [ ] **Bước 3: Viết spec.md**
  - Cấu trúc: Mô tả -> API / Interfaces chính -> Luồng dữ liệu -> File liên quan -> Xử lý lỗi -> Ghi chú kỹ thuật
  - Nội dung chính: liệt kê đầy đủ cấu trúc thư mục src/ (5 nhánh), build pipeline (tsup config), linting/formatting (ESLint + Prettier), testing (mocha + tsx + browser thật).
  - Ghi chú kỹ thuật: external list gồm 14 packages (kể cả dotenv), format script chỉ chạy `src/`, ESLint ignores dist/node_modules, `npm run clean` dùng `rm -rf` không chạy trên Windows.

- [ ] **Bước 4: Viết plan.md**
  - Cấu trúc: Các bước thực hiện -> File liên quan -> Kiểm tra -> Ghi chú
  - Nội dung chính: ghi lại các bước đã làm từ code (tạo package.json, cấu hình tsconfig, tsup, ESLint, Prettier, Mocha, thư mục, index.ts).

- [ ] **Bước 5: Viết product.md**
  - Cấu trúc: Tổng quan -> Cách dùng / Ví dụ code -> API -> Lifecycle -> Xử lý lỗi -> Môi trường
  - Nội dung chính: hướng dẫn cài đặt (npm install), yêu cầu hệ thống (Node >=18, Windows), ví dụ sử dụng nhanh, build/test/lint commands.
  - Lưu ý: giải thích headless:false, BABLOSOFT_KEY, chỉ launch một lần.

- [ ] **Bước 6: Viết overview.md**
  - Cấu trúc: Mục tiêu -> Kết quả -> Kiểm tra -> Sai lệch so với kế hoạch
  - Nội dung chính: pre-existing bug `npm run clean` dùng `rm -rf`, external list phải đầy đủ, `createRequire(import.meta.url)` trong ESM.

- [ ] **Bước 7: Chạy lint kiểm tra**
  - Chạy: `npm run lint`
  - Sửa lỗi nếu có

---

## Task 2: Type System

**Files cần đọc:**
- `src/types/PWChromium.ts` -- interface Chromium public API
- `src/types/fingerprint.ts` -- FingerprintOptions
- `src/types/proxy.ts` -- ProxyOptions
- `src/types/profile.ts` -- ProfileOptions
- `src/types/fetch.ts` -- FetchOptions, Tag, Time

**Files sẽ viết (ghi đè):**
- `docs/designs/type-system.design.md`
- `docs/specs/type-system.spec.md`
- `docs/plans/type-system.plan.md`
- `docs/products/type-system.product.md`
- `docs/overviews/type-system.overview.md`

- [ ] **Bước 1: Đọc code**
  - Đọc `PWChromium.ts`: interface chính với các method `useFingerprint`, `useProxy`, `useProfile`, `usePrivateKey`, `launch`, `newContext`, `newFingerprint`, `quit`, `repackChromium`.
  - Đọc `fingerprint.ts`: `FingerprintOptions` với `usePerfectCanvas`, `safeWebGL`, `safeAudio`, `safeCanvas`, `safeBattery`, `useFontPack`, `safeElementSize`, `emulateSensorAPI`, `emulateDeviceScaleFactor`.
  - Đọc `proxy.ts`: `ProxyOptions` với `changeWebRTC` ('enable'|'disable'|'replace'), `dnsMode` ('system-proxy'|'custom-proxy'|'custom-direct'), `enableQUIC`, `enableTunneling`, `changeTimezone`, `changeGeolocation`, `changeBrowserLanguage`, IP detection options.
  - Đọc `profile.ts`: `ProfileOptions` với `loadProxy` (boolean), `loadFingerprint` (boolean).
  - Đọc `fetch.ts`: `FetchOptions` với `tags` (Tag[]), `timeLimit` (string | Time), `minBrowserVersion`, `maxBrowserVersion`, ... `Tag` và `Time` types.

- [ ] **Bước 2: Viết design.md**
  - Giải thích vì sao thiết kế 5 file type riêng, vì sao PWChromium là interface cho singleton Chromium.
  - Giải thích lựa chọn các option (ví dụ `changeWebRTC: 'replace'` mặc định).

- [ ] **Bước 3: Viết spec.md**
  - Liệt kê từng file type, các interface/type chính, mô tả từng field.
  - Ghi rõ kiểu dữ liệu, giá trị mặc định (nếu có), ví dụ.

- [ ] **Bước 4: Viết plan.md**
  - Ghi lại thứ tự tạo file, dependencies giữa các type.

- [ ] **Bước 5: Viết product.md**
  - Hướng dẫn import type, ví dụ sử dụng từng type.
  - Giải thích các option phức tạp (DNS mode, WebRTC, IP detection).

- [ ] **Bước 6: Viết overview.md**

- [ ] **Bước 7: Chạy lint**

---

## Task 3: Error Hierarchy

**Files cần đọc:**
- `src/plugin/errors.ts` -- PluginError, MissingKeyError, InvalidEngineError, EngineTimeoutError, RequestTimeoutError

**Files sẽ viết (ghi đè):**
- `docs/designs/error-hierarchy.design.md`
- `docs/specs/error-hierarchy.spec.md`
- `docs/plans/error-hierarchy.plan.md`
- `docs/products/error-hierarchy.product.md`
- `docs/overviews/error-hierarchy.overview.md`

- [ ] **Bước 1: Đọc code**
  - Đọc `errors.ts`: PluginError extends Error, các subclass, mỗi class có prefix message, constructor nhận message string.

- [ ] **Bước 2: Viết design.md**
  - Giải thích tại sao cần Error hierarchy thay vì Error thô, tại sao cần prefix cho dễ debug.

- [ ] **Bước 3: Viết spec.md**
  - Liệt kê class hierarchy, constructor signature, khi nào throw từng loại.

- [ ] **Bước 4: Viết plan.md**

- [ ] **Bước 5: Viết product.md**
  - Hướng dẫn catch error theo từng loại, ví dụ code.

- [ ] **Bước 6: Viết overview.md**

- [ ] **Bước 7: Chạy lint**

---

## Task 4: RemoteEngine

**Files cần đọc:**
- `src/plugin/connector/engine.ts` -- RemoteEngine class (373 dòng)
- `src/plugin/connector/utils.ts`
- `project.xml` -- chứa EngineVersion

**Files sẽ viết (ghi đè):**
- `docs/designs/remote-engine.design.md`
- `docs/specs/remote-engine.spec.md`
- `docs/plans/remote-engine.plan.md`
- `docs/products/remote-engine.product.md`
- `docs/overviews/remote-engine.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích `engine.ts`: `RemoteEngine extends EventEmitter`
    - `#updateMeta()`: đọc `project.xml`, parse `<EngineVersion>`, fetch metadata từ `bablosoft.com`, cache vào JSON file.
    - `#startProcess(timeout)`: gọi `#startProcessInternal()`, download/extract/spawn engine, kiểm tra checksum SHA1.
    - `runFunction(name, params)`: IPC file-based -- ghi JSON request, chokidar watch response, dọn request cũ.
    - `CLOSE_TIMEOUT = 60s`, `DEFAULT_TIMEOUT = 300s`.
    - `PROJECT_PATH` resolve từ `package.json` root.
  - Đọc `utils.ts`: các hàm helper.

- [ ] **Bước 2: Viết design.md**
  - Giải thích tại sao file-based IPC thay vì pipe/socket, tại sao fetch metadata từ bablosoft, cache để làm gì.
  - Giải thích cơ chế retry khi download lỗi, checksum verify.

- [ ] **Bước 3: Viết spec.md**
  - Mô tả chi tiết lifecycle: constructor -> updateMeta -> startProcess -> runFunction (tạo request, watch, parse response).
  - API: `setCwd`, `setArgs`, `setEngineTimeout`, `setRequestTimeout`, `runFunction`.
  - Sự kiện: `'beforeDownload'`, `'beforeExtract'`.
  - Error: `EngineTimeoutError`, `InvalidEngineError`, `RequestTimeoutError`.
  - Cấu trúc thư mục engine data.

- [ ] **Bước 4: Viết plan.md**
  - Ghi lại các bước đã code: tạo class, implement metadata fetching, download/extract/spawn, file-based IPC.

- [ ] **Bước 5: Viết product.md**
  - Ví dụ dùng RemoteEngine trực tiếp (nếu có).
  - Giải thích timeout config, events.
  - Cảnh báo: quá trình download có thể mất 1-2 phút.

- [ ] **Bước 6: Viết overview.md**

- [ ] **Bước 7: Chạy lint**

---

## Task 5: API Connector

**Files cần đọc:**
- `src/plugin/connector/index.ts` -- API connector (singleton)
- `src/plugin/connector/utils.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/api-connector.design.md`
- `docs/specs/api-connector.spec.md`
- `docs/plans/api-connector.plan.md`
- `docs/products/api-connector.product.md`
- `docs/overviews/api-connector.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích `connector/index.ts`: singleton pattern, async-lock, `api(name, params)` wrapper, auto-start PCAP server.
  - Các API method: `setup`, `versions`, `get_bounds`, `get_defaults`.

- [ ] **Bước 2-7: Viết lần lượt các file** (tương tự cấu trúc các task trên)

---

## Task 6: PCAP Server

**Files cần đọc:**
- `src/plugin/connector/pcapServer/index.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/pcap-server.design.md`
- `docs/specs/pcap-server.spec.md`
- `docs/plans/pcap-server.plan.md`
- `docs/products/pcap-server.product.md`
- `docs/overviews/pcap-server.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích: TCP server mô phỏng PCAP interface, xử lý 2 lệnh binary `0x01` (request ID), `0x07` (heartbeat), retry port khi EADDRINUSE.

- [ ] **Bước 2-7: Viết lần lượt các file**

---

## Task 7: Browser Launcher

**Files cần đọc:**
- `src/plugin/launcher/index.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/browser-launcher.design.md`
- `docs/specs/browser-launcher.spec.md`
- `docs/plans/browser-launcher.plan.md`
- `docs/products/browser-launcher.product.md`
- `docs/overviews/browser-launcher.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích: spawn Chromium child process, detect DevTools listening URL từ stderr/stdout, interface Browser với configure, close.

- [ ] **Bước 2-7: Viết lần lượt các file**

---

## Task 8: Native Mutex

**Files cần đọc:**
- `src/plugin/mutex/index.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/native-mutex.design.md`
- `docs/specs/native-mutex.spec.md`
- `docs/plans/native-mutex.plan.md`
- `docs/products/native-mutex.product.md`
- `docs/overviews/native-mutex.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích: native C++ addon mutex.node, hỗ trợ win32 32-bit + 64-bit, `create(name)` tạo named mutex.

- [ ] **Bước 2-7: Viết lần lượt các file**

---

## Task 9: FingerprintPlugin

**Files cần đọc:**
- `src/plugin/index.ts` -- FingerprintPlugin class
- `src/plugin/config.ts`
- `src/plugin/browser.ts`
- `src/plugin/utils.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/fingerprint-plugin.design.md`
- `docs/specs/fingerprint-plugin.spec.md`
- `docs/plans/fingerprint-plugin.plan.md`
- `docs/products/fingerprint-plugin.product.md`
- `docs/overviews/fingerprint-plugin.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích: lifecycle setup -> spawn -> configure -> cleanup.
  - Fluent config: `useFingerprint`, `useProxy`, `useProfile`, `useBrowserVersion`.
  - `fetch()` -- lấy fingerprint từ service.
  - `versions()` -- danh sách browser version.
  - `_launch()` -- core: gọi `api('setup')`, spawn worker.exe, cleaner.watch, mutex.create, configure viewport, sync.

- [ ] **Bước 2-7: Viết lần lượt các file**

---

## Task 10: Playwright Bridge

**Files cần đọc:**
- `src/adapter/playwright/engine.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/playwright-bridge.design.md`
- `docs/specs/playwright-bridge.spec.md`
- `docs/plans/playwright-bridge.plan.md`
- `docs/products/playwright-bridge.product.md`
- `docs/overviews/playwright-bridge.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích: bridge giữa FingerprintPlugin và Playwright BrowserType.
  - Override `launch`/`launchPersistentContext`.
  - Validate unsupported options (proxy, channel, firefoxUserPrefs).
  - Filter ignored Chromium arguments.

- [ ] **Bước 2-7: Viết lần lượt các file**

---

## Task 11: BrowserEngine

**Files cần đọc:**
- `src/adapter/playwright/chromium.ts` -- BrowserEngine class (228 dòng)

**Files sẽ viết (ghi đè):**
- `docs/designs/browser-engine.design.md`
- `docs/specs/browser-engine.spec.md`
- `docs/plans/browser-engine.plan.md`
- `docs/products/browser-engine.product.md`
- `docs/overviews/browser-engine.overview.md`

- [ ] **Bước 1: Đọc code**
  - Phân tích: singleton Chromium, fluent API `usePrivateKey -> useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit`.
  - `repackChromium()`: thay thế launcher.
  - `launch()`: hợp nhất options, cấu hình engine, chỉ launch 1 lần.
  - `quit()`: close context, unmap profile.
  - Constants: `PRIVATE_KEY`, `BROWSER_RUNNING_DIR`, `ENGINE_WORKING_DIR`.
  - `DEFAULT_CONTEXT_OPTIONS`: `{ headless: false, hasTouch: true }`.

- [ ] **Bước 2: Viết design.md**
  - Giải thích tại sao singleton, tại sao fluent pattern, tại sao `headless: false`, `hasTouch: true`.
  - Giải thích profile safety (copy -> run -> copy back).

- [ ] **Bước 3: Viết spec.md**
  - API đầy đủ: tất cả method, tham số, kiểu trả về.
  - Lifecycle rules (launch/newContext/quit/use*).
  - Constants và môi trường.
  - Flow: khởi tạo -> cấu hình -> launch -> newContext -> quit.

- [ ] **Bước 4: Viết plan.md**
  - Các bước đã code: BrowserEngine class, fluent methods, lifecycle management, adapter data manager.

- [ ] **Bước 5: Viết product.md**
  - Ví dụ đầy đủ từ đầu đến cuối.
  - Lifecycle rules dạng bảng.
  - Profile safety giải thích.
  - repackChromium custom launcher.
  - Môi trường: BABLOSOFT_KEY, BROWSER_RUNNING_DIR, ENGINE_WORKING_DIR.

- [ ] **Bước 6: Viết overview.md**

- [ ] **Bước 7: Chạy lint**

---

## Task 12: Cấu hình Fingerprint

**Files cần đọc:**
- `src/types/fingerprint.ts`
- `src/plugin/config.ts` -- phần xử lý fingerprint options
- `src/plugin/index.ts` -- phần useFingerprint

**Files sẽ viết (ghi đè):**
- `docs/designs/fingerprint-config.design.md`
- `docs/specs/fingerprint-config.spec.md`
- `docs/plans/fingerprint-config.plan.md`
- `docs/products/fingerprint-config.product.md`
- `docs/overviews/fingerprint-config.overview.md`

---

## Task 13: Cấu hình Proxy

**Files cần đọc:**
- `src/types/proxy.ts`
- `src/plugin/config.ts` -- phần proxy
- `src/plugin/index.ts` -- phần useProxy

**Files sẽ viết (ghi đè):**
- `docs/designs/proxy-config.design.md`
- `docs/specs/proxy-config.spec.md`
- `docs/plans/proxy-config.plan.md`
- `docs/products/proxy-config.product.md`
- `docs/overviews/proxy-config.overview.md`

---

## Task 14: Quản lý Profile

**Files cần đọc:**
- `src/adapter/playwright/data.ts` -- AdapterDataManager
- `src/plugin/index.ts` -- phần useProfile
- `src/plugin/config.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/profile-management.design.md`
- `docs/specs/profile-management.spec.md`
- `docs/plans/profile-management.plan.md`
- `docs/products/profile-management.product.md`
- `docs/overviews/profile-management.overview.md`

---

## Task 15: Quản lý Viewport

**Files cần đọc:**
- `src/adapter/playwright/utils.ts` -- setViewport, bindHooks
- `src/plugin/browser.ts`
- `src/plugin/config.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/viewport-management.design.md`
- `docs/specs/viewport-management.spec.md`
- `docs/plans/viewport-management.plan.md`
- `docs/products/viewport-management.product.md`
- `docs/overviews/viewport-management.overview.md`

---

## Task 16: File Cleanup Daemon

**Files cần đọc:**
- `src/plugin/cleaner.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/file-cleanup-daemon.design.md`
- `docs/specs/file-cleanup-daemon.spec.md`
- `docs/plans/file-cleanup-daemon.plan.md`
- `docs/products/file-cleanup-daemon.product.md`
- `docs/overviews/file-cleanup-daemon.overview.md`

---

## Task 17: Hook Binding

**Files cần đọc:**
- `src/adapter/playwright/utils.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/hook-binding.design.md`
- `docs/specs/hook-binding.spec.md`
- `docs/plans/hook-binding.plan.md`
- `docs/products/hook-binding.product.md`
- `docs/overviews/hook-binding.overview.md`

---

## Task 18: Common Scripts

**Files cần đọc:**
- `src/common/index.ts`

**Files sẽ viết (ghi đè):**
- `docs/designs/common-scripts.design.md`
- `docs/specs/common-scripts.spec.md`
- `docs/plans/common-scripts.plan.md`
- `docs/products/common-scripts.product.md`
- `docs/overviews/common-scripts.overview.md`

---

## Task 19: Playwright Module Loader

**Files cần đọc:**
- `src/loader/index.ts` -- Loader class
- `src/adapter/playwright/loader.ts` -- Playwright loader

**Files sẽ viết (ghi đè):**
- `docs/designs/playwright-module-loader.design.md`
- `docs/specs/playwright-module-loader.spec.md`
- `docs/plans/playwright-module-loader.plan.md`
- `docs/products/playwright-module-loader.product.md`
- `docs/overviews/playwright-module-loader.overview.md`

---

## Task 20: Debug Logging

**Files cần đọc:**
- `src/plugin/index.ts` -- debug namespace
- `src/plugin/connector/engine.ts` -- debug namespace
- `src/plugin/connector/index.ts` -- debug namespace
- `src/adapter/playwright/chromium.ts` -- debug namespace
- `src/adapter/playwright/engine.ts` -- debug namespace
- `src/cleaner.ts` -- debug namespace
- Tìm tất cả `debugFactory` usage trong codebase

**Files sẽ viết (ghi đè):**
- `docs/designs/debug-logging.design.md`
- `docs/specs/debug-logging.spec.md`
- `docs/plans/debug-logging.plan.md`
- `docs/products/debug-logging.product.md`
- `docs/overviews/debug-logging.overview.md`

---

## Task 21: Format và Comment Codebase (non-feature)

**Files cần đọc:**
- Toàn bộ source files (đã được format ở task trước)
- `AGENTS.md`

**Files sẽ viết (ghi đè):**
- `docs/designs/format-comment-codebase.design.md`
- `docs/specs/format-comment-codebase.spec.md`
- `docs/plans/format-comment-codebase.plan.md`
- `docs/overviews/format-comment-codebase.overview.md`

---

## Kiểm tra tổng thể

Sau khi hoàn thành tất cả task:

- [ ] Chạy `npm run lint` -- toàn bộ src/ không lỗi
- [ ] Chạy `npm run build` -- build thành công (ESM + CJS + DTS)
- [ ] Kiểm tra docs/ không có file nào bị thiếu

## Ghi chú

- Mỗi task có thể chạy độc lập -- không phụ thuộc vào nhau về mặt nội dung.
- Nếu phát hiện sai lệch giữa code và docs cũ, ưu tiên code là chuẩn.
- Pre-existing bug: `npm run clean` dùng `rm -rf` không chạy trên Windows (ghi nhận trong overview của Task 1).
- External list có 14 packages trong tsup.config.ts -- nếu thay đổi, cập nhật spec của Task 1.
