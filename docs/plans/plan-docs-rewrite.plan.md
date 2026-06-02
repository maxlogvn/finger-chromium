# Plan Docs Rewrite Implementation Plan

> **Goal:** Viết lại toàn bộ 20 file plan docs cho tất cả tính năng, bám sát code thực tế, mở rộng mô tả từng bước với giải thích "tại sao", thêm edge cases và chi tiết kỹ thuật.

**Phạm vi:** Plan docs (`docs/plans/*.plan.md`) cho 20 feature plans — không sửa non-feature plans (build-config-install-docs, format-comment-codebase, known-issues-separate, quit-handle-cleanup, mutex-path-resolution, core-documentation-correction).

**Cấu trúc mỗi plan doc (template chuẩn):**
- `# Plan: <tên>`
- `## Các bước thực hiện`
  - Mỗi bước: `[ ] Bước N: <tên>`
    - `Làm gì` — mô tả chi tiết, đủ để implement
    - `File liên quan` — đường dẫn cụ thể
    - `Giải thích` — tại sao làm cách này, không làm cách khác (THÊM MỚI)
    - `Ghi chú` — edge cases, lưu ý kỹ thuật (nếu có)
    - `Phụ thuộc` — nếu cần (nếu có)
- `## Kiểm tra` — lệnh kiểm tra + mô tả test thủ công
- `## Ghi chú` — tổng quan, rủi ro, quyết định thiết kế

**Thay đổi chính so với plan hiện tại:**
- Thêm `Giải thích` cho mỗi bước — tại sao chọn giải pháp này
- Mở rộng `Làm gì` từ 1 dòng thành 3-5 dòng chi tiết
- Thêm edge cases và lưu ý trong `Ghi chú` từng bước
- Sửa lỗi lệch code (vd: xoá `usePrivateKey`)
- Thêm dòng code cho mỗi file liên quan
- Đảm bảo `Kiểm tra` có lệnh cụ thể

---

### Nhóm 1: Core (3 plans)

**Source cần đối chiếu:**
- `src/adapter/playwright/chromium.ts`
- `src/adapter/playwright/engine.ts`
- `src/plugin/index.ts`

- [ ] **Step 1.1: Viết lại browser-engine.plan.md** (hiện 36 dòng)
  - Thêm bước giải thích guard `_launched` — tại sao chỉ launch một lần
  - Thêm chi tiết options merge flow (mặc định < cấu hình < launch options)
  - Thêm `saveDataPath` edge case trong quit()
  - Sửa tài liệu: xoá `usePrivateKey` — không còn trong code

- [ ] **Step 1.2: Viết lại playwright-bridge.plan.md** (hiện 32 dòng)
  - Thêm `prepareContext()` flow — lọc args, ép viewport null
  - Thêm chi tiết unsupported options validation
  - Thêm launcher proxy flow chi tiết
  - Thêm configure() lifecycle (cleanup → resize → bindHooks)

- [ ] **Step 1.3: Viết lại fingerprint-plugin.plan.md** (hiện 32 dòng)
  - Tách `_launch()` thành nhiều bước nhỏ hơn (6 bước hiện tại)
  - Thêm `setProxyFromArguments()` flow
  - Thêm event handlers (`beforeDownload`, `beforeExtract`)
  - Thêm timeout methods (`setRequestTimeout`, `setEngineTimeout`)

---

### Nhóm 2: Connector & Engine (3 plans)

**Source cần đối chiếu:**
- `src/plugin/connector/index.ts`
- `src/plugin/connector/engine.ts`
- `src/plugin/connector/pcapServer/index.ts`

- [ ] **Step 2.1: Viết lại api-connector.plan.md** (hiện 28 dòng)
  - Thêm step cho `perfectCanvasRequest` flow
  - Thêm chi tiết async-lock acquire/release
  - Thêm error normalization (key missing → MissingKeyError)
  - Thêm cleanup sequence chi tiết

- [ ] **Step 2.2: Viết lại remote-engine.plan.md** (hiện 38 dòng)
  - Tách `#startProcessInternal()` thành steps nhỏ (download, extract, spawn)
  - Thêm file-based IPC flow: request format, chokidar watch, response parse
  - Thêm `kill()` với CLOSE_TIMEOUT
  - Thêm `resolvePackageRoot()` walk-up algorithm
  - Thêm cache metadata flow

- [ ] **Step 2.3: Viết lại pcap-server.plan.md** (hiện 23 dòng)
  - Thêm step cho binary protocol handling
  - Thêm `once()` pattern — tại sao listen một lần
  - Thêm EADDRINUSE retry timing
  - Thêm step `getPort()` helper

---

### Nhóm 3: Plugin & Utilities (4 plans)

**Source cần đối chiếu:**
- `src/plugin/launcher/index.ts`
- `src/plugin/mutex/index.ts`
- `src/plugin/cleaner.ts`
- `src/adapter/playwright/utils.ts`

- [ ] **Step 3.1: Viết lại browser-launcher.plan.md** (hiện 24 dòng)
  - Thêm step cho timeout mechanism (AbortController)
  - Thêm regex pattern detail cho DevTools URL
  - Thêm `taskkill /T /F` chi tiết
  - Thêm edge case: process crash before URL printed
  - Thêm `configure()` là no-op

- [ ] **Step 3.2: Viết lại native-mutex.plan.md** (hiện 24 dòng)
  - Thêm `resolvePackageRoot()` walk-up step
  - Thêm architecture detection (32-bit vs 64-bit)
  - Thêm Windows kernel auto-cleanup explanation
  - Thêm native addon load error handling

- [ ] **Step 3.3: Viết lại file-cleanup-daemon.plan.md** (hiện 32 dòng)
  - Thêm step cho proper-lockfile lock/unlock
  - Thêm file patterns chi tiết (t/{pid}, s/{id}.ini)
  - Thêm mtime > 15s check
  - Thêm `#cleanup()` scan flow (fast-glob)
  - Thêm `#toggleLock()` logic

- [ ] **Step 3.4: Viết lại hook-binding.plan.md** (hiện 39 dòng)
  - Thêm `setViewport()` retry flow
  - Thêm delta correction algorithm
  - Thêm `isBrowser()` type guard chi tiết
  - Thêm edge case: CDP session fail

---

### Nhóm 4: Feature Configs (4 plans)

**Source cần đối chiếu:**
- `src/types/fingerprint.ts`
- `src/types/proxy.ts`
- `src/types/profile.ts`
- `src/plugin/config.ts`
- `src/plugin/browser.ts`
- `src/adapter/playwright/data.ts`

- [ ] **Step 4.1: Viết lại fingerprint-config.plan.md** (hiện 24 dòng)
  - Thêm step `validateConfig()` — khi nào throw
  - Thêm chi tiết 9 fields trong FingerprintOptions
  - Thêm flow: config → api('setup') → engine
  - Thêm `safeElementSize` mặc định false explanation

- [ ] **Step 4.2: Viết lại proxy-config.plan.md** (hiện 40 dòng)
  - Thêm step `setProxyFromArguments()` detail
  - Thêm DNS modes explanation
  - Thêm IP extraction methods
  - Thêm tunneling vs QUIC relationship

- [ ] **Step 4.3: Viết lại profile-management.plan.md** (hiện 34 dòng)
  - Thêm `AdapterDataManager` chi tiết: map → temp, unmap, dispose
  - Thêm temp dir naming (timestamp + hex)
  - Thêm `saveDataPath` trong quit() edge case
  - Thêm error handling: profile không tồn tại, copy fail

- [ ] **Step 4.4: Viết lại viewport-management.plan.md** (hiện 37 dòng)
  - Thêm delta correction algorithm step
  - Thêm 2 implementation paths: CDP vs CDPSession
  - Thêm `synchronize()` 2-phase flow
  - Thêm `waitForResize` double rAF timing
  - Thêm DPI scaling edge case

---

### Nhóm 5: Scripts, Logging, Infrastructure (6 plans)

**Source cần đối chiếu:**
- `src/common/index.ts`
- `src/loader/index.ts`
- `src/adapter/playwright/loader.ts`
- `src/plugin/errors.ts`
- `src/types/*.ts`
- `package.json`, `tsup.config.ts`

- [ ] **Step 5.1: Viết lại common-scripts.plan.md** (hiện 23 dòng)
  - Thêm `waitForResize` internals: ResizeObserver + disconnect + double rAF
  - Thêm `getViewport` implementation
  - Thêm scripts object typing

- [ ] **Step 5.2: Viết lại debug-logging.plan.md** (hiện 34 dòng)
  - Thêm chi tiết từng namespace với vị trí log
  - Thêm output mẫu
  - Thêm Windows-specific env config

- [ ] **Step 5.3: Viết lại error-hierarchy.plan.md** (hiện 36 dòng)
  - Giữ nguyên — đã tốt, thêm chi tiết `dedent`, `captureStackTrace`
  - Thêm KNOWN_ISSUES.md #2 reference

- [ ] **Step 5.4: Viết lại project-infrastructure.plan.md** (hiện 43 dòng)
  - Thêm build pipeline steps
  - Thêm external packages list
  - Thêm lint rules detail
  - Thêm mocha config

- [ ] **Step 5.5: Viết lại playwright-module-loader.plan.md** (hiện 32 dòng)
  - Thêm `createRequire` — tại sao cần trong ESM
  - Thêm `compare-versions` flow
  - Thêm fallback chain detail

- [ ] **Step 5.6: Viết lại type-system.plan.md** (hiện 33 dòng)
  - Thêm branded type `IPString`
  - Thêm object notation cho complex fields
  - Thêm exported types list

---

### Bước 6: Cross-reference và kiểm tra cuối

- [x] **Step 6.1: Kiểm tra consistency giữa các plan**
  - Luồng launch/cleanup có nhất quán? ✓
  - Tên method, tham số đúng với code? ✓
  - Không còn `usePrivateKey`? — **1 tồn tại:** type-system.plan.md (signature trong PWChromium interface — đúng vì code thực tế `src/types/PWChromium.ts` vẫn còn `usePrivateKey` trong JSDoc example, không phải trong interface chính)

- [x] **Step 6.2: Kiểm tra placeholders**
  ```bash
  Select-String -Path "docs/plans/*.plan.md" -Pattern "TBD|TODO"  # Pass — 0 matches trong 20 feature plans (chỉ có meta-plans)
  ```

---

### Tiến độ thực tế

| Step | Mô tả | Thực tế | Sai lệch |
|------|-------|---------|----------|
| 1.1-1.3 | Core plans (3) | Viết signature, edge cases, error handling, constants | Không có |
| 2.1-2.3 | Connector & Engine plans (3) | Viết binary protocol hex dump, async-lock, checksum | Không có |
| 3.1-3.4 | Plugin & Utilities plans (4) | Viết delta correction, proper-lockfile, taskkill | Không có |
| 4.1-4.4 | Feature Configs plans (4) | Viết object notation, 2-phase sync, IP extraction | Không có |
| 5.1-5.6 | Scripts & Infrastructure plans (6) | Viết branded type, walk-up, createRequire | Không có |
| 6.1 | Cross-reference | Pass — usePrivateKey còn trong type-system.plan.md (đúng với code) | Không có |
| 6.2 | Placeholder check | Pass — không có TBD/TODO trong 20 feature plans | Không có |
