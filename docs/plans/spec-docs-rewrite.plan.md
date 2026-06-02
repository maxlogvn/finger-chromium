# Spec Docs Rewrite Implementation Plan

> **Goal:** Viết lại toàn bộ 20 file spec docs cho tất cả tính năng, theo template chuẩn và phong cách giải thích "tại sao" bên cạnh "làm gì". Dựa trên code thực tế. Mỗi spec phải đủ chi tiết để developer có thể implement lại tính năng mà không cần đọc source.

**Phạm vi:** Spec docs (`docs/specs/*.spec.md`) — không sửa design/plan/product/overview trong đợt này.

**Cấu trúc mỗi spec doc (template chuẩn):**
- `## Mô tả` — tính năng làm gì, tại sao cần, vị trí trong hệ thống
- `## Yêu cầu` — functional + non-functional requirements
- `## Thiết kế` — kiến trúc tổng quan, sơ đồ flow
- `## API / Data flow` — input/output, luồng dữ liệu, schema
- `## Components` — module/files liên quan, trách nhiệm, file path + dòng code
- `## Xử lý lỗi` — từng trường hợp lỗi + hành vi
- `## Kiểm tra` — happy path, edge case, error case
- Có thể thêm: `## Constants`, `## Environment variables`, `## Events` nếu cần

---

### Nhóm 1: Core (3 specs — đã decent, rewrite để consistent)

**Source cần đối chiếu:**
- `src/adapter/playwright/chromium.ts`
- `src/adapter/playwright/engine.ts`
- `src/plugin/index.ts`

- [ ] **Step 1.1: Viết lại browser-engine.spec.md** (hiện 109 dòng)

Thay đổi chính:
- Thêm giải thích "tại sao" cho guard một lần, default options
- Thêm chi tiết luồng `launch()` hợp nhất options từ 3 nguồn
- Thêm edge cases cho `quit()` với saveDataPath
- Components: thêm line count / chi tiết hơn
- Sửa `PRIVATE_KEY` thành `BABLOSOFT_KEY` cho đúng tên env

- [ ] **Step 1.2: Viết lại playwright-bridge.spec.md** (hiện 108 dòng)

Thay đổi chính:
- Thêm giải thích ép `viewport: null` — fingerprint tự resize, Playwright làm trước là thừa
- Thêm chi tiết launcher proxy flow (lược bỏ `--user-data-dir`)
- Thêm `configure()` flow với cleanup + resize + bindHooks
- Bảng `UNSUPPORTED_OPTIONS` + lý do từng cái

- [ ] **Step 1.3: Viết lại fingerprint-plugin.spec.md** (hiện 113 dòng)

Thay đổi chính:
- Thêm chi tiết `setProxyFromArguments()` flow (fallback proxy từ args)
- Thêm 6 bước `_launch()` với giải thích từng bước
- Thêm event handlers: `beforeDownload`, `beforeExtract`
- Thêm `setRequestTimeout`, `setEngineTimeout` — mục đích, khi nào dùng
- Bảng method đầy đủ hơn

---

### Nhóm 2: Connector & Engine (3 specs — cần rewrite sâu)

**Source cần đối chiếu:**
- `src/plugin/connector/index.ts`
- `src/plugin/connector/engine.ts`
- `src/plugin/connector/pcapServer/index.ts`

- [ ] **Step 2.1: Viết lại api-connector.spec.md** (hiện 42 dòng — quá sơ sài)

Thay đổi chính:
- Thêm `perfectCanvasRequest` — requestTimeout = 0 flow
- Thêm events: `beforeDownload`, `beforeExtract` handlers
- Thêm env vars: `FINGERPRINT_CWD`, `FINGERPRINT_TIMEOUT`
- Thêm export `engine` — khi nào cần truy cập trực tiếp
- Thêm chi tiết async-lock đồng bộ
- Thêm error normalization flow (key missing -> MissingKeyError)
- Bảng method engine có thể gọi qua `api()`

- [ ] **Step 2.2: Viết lại remote-engine.spec.md** (hiện 90 dòng)

Thay đổi chính:
- Thêm chi tiết file-based IPC: request file format, chokidar watch flow
- Thêm `kill()` method + CLOSE_TIMEOUT
- Thêm `resolvePackageRoot()` walk-up algorithm
- Thêm ARCH auto-detection logic
- Thêm cache metadata flow
- Thêm event `beforeDownload`, `beforeExtract` chi tiết
- Bảng constants + hằng số
- Thêm chi tiết timeout: DEFAULT_TIMEOUT, CLOSE_TIMEOUT

- [ ] **Step 2.3: Viết lại pcap-server.spec.md** (hiện 28 dòng — quá sơ sài)

Thay đổi chính:
- Thêm binary protocol encoding chi tiết (0x01 request format, response format)
- Thêm sequence diagram: engine -> server -> response
- Thêm `once()` pattern — tại sao listen một lần
- Thêm EADDRINUSE retry với timing
- Thêm `getPort()` helper
- Thêm mối liên hệ với engine args (`--mock-pcap-port`)

---

### Nhóm 3: Plugin & Utilities (4 specs — moderate rewrite)

**Source cần đối chiếu:**
- `src/plugin/launcher/index.ts`
- `src/plugin/mutex/index.ts`
- `src/plugin/cleaner.ts`
- `src/adapter/playwright/utils.ts`

- [ ] **Step 3.1: Viết lại browser-launcher.spec.md** (hiện 47 dòng)

Thay đổi chính:
- Thêm timeout mechanism — parse với AbortController
- Thêm regex pattern chi tiết cho DevTools URL
- Thêm `taskkill` flow: /T (process tree), /F (force)
- Thêm edge case: process không in URL, stderr vs stdout
- Thêm `configure()` là no-op (tương thích interface)
- Thêm `Browser` interface chi tiết

- [ ] **Step 3.2: Viết lại native-mutex.spec.md** (hiện 37 dòng)

Thay đổi chính:
- Thêm `resolvePackageRoot()` flow cho mutex.node path
- Thêm walk-up algorithm để tìm package.json
- Thêm architecture detection (32-bit vs 64-bit)
- Thêm Windows kernel auto-cleanup — tại sao release có thể là no-op
- Thêm native addon load flow + fallback error

- [ ] **Step 3.3: Viết lại file-cleanup-daemon.spec.md** (hiện 60 dòng — đã decent)

Thay đổi chính:
- Thêm chi tiết proper-lockfile flow
- Thêm file patterns: `t/{pid}`, `s/{id}.ini`, `s/{id}1.ini`
- Thêm mtime > 15s check — tại sao không xoá file mới tạo
- Thêm timer `.unref()` — tại sao không block process exit
- Thêm fast-glob pattern cho scan
- Thêm cleanup sequence chi tiết

- [ ] **Step 3.4: Viết lại hook-binding.spec.md** (hiện 107 dòng — đã good)

Thay đổi chính:
- Thêm `isBrowser()` type guard chi tiết
- Thêm `setViewport()` retry flow với delta correction steps
- Thêm Fallback cho launchPersistentContext
- Thêm `onClose` flow: disconnected vs close event
- Thêm edge case: CDP session fail, resize retry timeout

---

### Nhóm 4: Feature Configs (4 specs — rewrite để consistent)

**Source cần đối chiếu:**
- `src/types/fingerprint.ts`
- `src/types/proxy.ts`
- `src/types/profile.ts`
- `src/plugin/config.ts`
- `src/plugin/browser.ts`
- `src/adapter/playwright/data.ts`

- [ ] **Step 4.1: Viết lại fingerprint-config.spec.md** (hiện 35 dòng — sơ sài)

Thay đổi chính:
- Thêm bảng option đầy đủ 9 fields
- Thêm validate flow: `validateConfig()` — khi nào throw
- Thêm chi tiết `usePerfectCanvas` — kỹ thuật mạnh nhất nhưng yêu cầu dữ liệu
- Thêm `safeElementSize` mặc định `false` — giải thích tại sao
- Thêm flow: config được gửi lên engine qua `api('setup')`

- [ ] **Step 4.2: Viết lại proxy-config.spec.md** (hiện 110 dòng — đã good)

Thay đổi chính:
- Thêm `ipExtractionMethod` với object notation explanation
- Thêm `privateIPv4`/`privateIPv6` union types
- Thêm DNS modes: khi nào dùng cái nào
- Thêm proxy fallback: `setProxyFromArguments()` flow
- Thêm tunneling vs QUIC relationship

- [ ] **Step 4.3: Viết lại profile-management.spec.md** (hiện 33 dòng)

Thay đổi chính:
- Thêm `AdapterDataManager` chi tiết: map/unmap/dispose flow
- Thêm temp dir naming convention (timestamp + hex)
- Thêm copy flow: recursive copy, có thể xảy ra lỗi
- Thêm `saveDataPath` trong `quit()` — lưu vào đường dẫn khác
- Thêm edge case: profile rỗng, không tồn tại
- Thêm `loadProxy`/`loadFingerprint` — gửi lên engine

- [ ] **Step 4.4: Viết lại viewport-management.spec.md** (hiện 57 dòng)

Thay đổi chính:
- Thêm delta correction algorithm chi tiết
- Thêm 2 implementation paths: chrome-remote-interface (plugin) vs CDPSession (Playwright)
- Thêm `synchronize()` flow cho `.ini` file
- Thêm retry logic: 3 lần, delta điều chỉnh
- Thêm `waitForResize` + double rAF timing
- Thêm edge case: DPI scaling, multi-monitor

---

### Nhóm 5: Scripts, Logging, Infrastructure (6 specs — moderate rewrite)

**Source cần đối chiếu:**
- `src/common/index.ts`
- `src/loader/index.ts`
- `src/adapter/playwright/loader.ts`
- `src/plugin/errors.ts`
- `src/types/*.ts`
- `package.json`, `tsup.config.ts`, `eslint.config.ts`

- [ ] **Step 5.1: Viết lại common-scripts.spec.md** (hiện 34 dòng)

Thay đổi chính:
- Thêm `waitForResize` internals: ResizeObserver + disconnect + double rAF
- Thêm CDP evaluate vs page.evaluate khác biệt
- Thêm closure variable constraint
- Thêm type `Record<string, Function>` cho scripts object

- [ ] **Step 5.2: Viết lại debug-logging.spec.md** (hiện 47 dòng — đã decent)

Thay đổi chính:
- Thêm `debugFactory('namespace')` pattern
- Thêm bảng namespace đầy đủ với số log + loại log
- Thêm output format mẫu
- Thêm zero overhead mechanism
- Thêm Windows-specific: `set` vs `$env:DEBUG`

- [ ] **Step 5.3: Viết lại error-hierarchy.spec.md** (hiện 103 dòng — đã good)

Thay đổi chính:
- Thêm chi tiết `captureStackTrace` — tại sao cần
- Thêm `Symbol.toStringTag` — khi nào debug cần
- Thêm `dedent` — format message cho dễ đọc
- Thêm `KNOWN_ISSUES.md #2` reference
- Thêm class diagram với inheritance

- [ ] **Step 5.4: Viết lại project-infrastructure.spec.md** (hiện 78 dòng — đã decent)

Thay đổi chính:
- Thêm build pipeline chi tiết: tsup entry -> ESM + CJS + DTS
- Thêm external packages list (13 packages)
- Thêm lint rules + format rules
- Thêm test config: mocha + tsx
- Thêm Windows-specific scripts
- Bảng export public từ `src/index.ts`

- [ ] **Step 5.5: Viết lại playwright-module-loader.spec.md** (hiện 62 dòng — đã decent)

Thay đổi chính:
- Thêm `createRequire` — tại sao cần trong ESM
- Thêm `compare-versions` — version comparison flow
- Thêm fallback chain logic
- Thêm Generic Loader class API
- Thêm error messages bảng

- [ ] **Step 5.6: Viết lại type-system.spec.md** (hiện 120 dòng — đã good)

Thay đổi chính:
- Thêm chi tiết `IPString = string & {}` branded type
- Thêm object notation cho complex ProxyOptions fields
- Thêm exported types list từ index.ts
- Thêm `satisfies` usage pattern

---

### Task 6: Cross-reference và kiểm tra cuối cùng

- [ ] **Step 6.1: Đọc lại 20 file spec đã viết, kiểm tra consistency:**
  - Luồng launch và cleanup có nhất quán giữa các spec không?
  - Tên method, tham số có đúng với code không?
  - `usePrivateKey` có còn sót không?
  - Import trong ví dụ code có đúng không?
  - Link tham chiếu giữa các spec → product → design có đúng không?

- [ ] **Step 6.2: Rà soát các spec còn lại** (non-feature tasks: core-documentation-correction, mutex-path-resolution, quit-handle-cleanup, known-issues-separate, format-comment-codebase, build-config-install-docs) — Có cần sửa không? Các spec này mô tả bug fix/task, không phải tính năng. Nên **không sửa** vì chúng mô tả đúng quá trình đã thực hiện.

- [ ] **Step 6.3: Kiểm tra tổng thể:**
  ```bash
  Select-String -Path "docs/specs/*.md" -Pattern "usePrivateKey"
  Select-String -Path "docs/specs/*.md" -Pattern "TBD|TODO|\.\.\.|<tên"
  ```
