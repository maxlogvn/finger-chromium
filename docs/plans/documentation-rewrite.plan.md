# Plan: Viết lại toàn bộ tài liệu theo template chuẩn

> **For agentic workers:** Implementation follows roadmap order, top to bottom. Mỗi task xử lý một feature, viết 5 file tài liệu theo template.

**Goal:** Rewrite toàn bộ ~105 file tài liệu (design, spec, plan, product, overview) cho 21 features, đảm bảo cấu trúc khớp template và nội dung khớp code thật.

**Architecture:** Với mỗi feature, đọc code -> viết 5 file theo template. Xử lý tuần tự theo roadmap.

**Tech Stack:** Markdown, TypeScript source code.

---

## Quy trình chung cho mỗi task

Mỗi task đều có 5 bước giống nhau, chỉ khác file source cần đọc và tên file output.

### Bước 1: Đọc code
Đọc toàn bộ file source liên quan đến feature. Ghi chú: API, interfaces, lifecycle, xử lý lỗi, dependencies.

### Bước 2: Viết design.md
Theo `docs/templates/design.template.md`:
```markdown
# Design: <tên feature>

## Bối cảnh
<Vấn đề cần giải quyết, lý do feature này tồn tại>

## Câu hỏi làm rõ
<Các câu hỏi đã được trả lời trong quá trình thiết kế>

## Các phương án

### Phương án 1: <tên>
<Mô tả>
- Ưu điểm: ...
- Nhược điểm: ...

### Phương án 2: <tên>
...

## Giải pháp được chọn
- Phương án được chọn: ...
- Lý do: ...
- Luồng hoạt động tổng quát: ...
```

### Bước 3: Viết spec.md
Theo `docs/templates/spec.template.md`:
```markdown
# Spec: <tên feature>

## Mô tả
...

## Yêu cầu
- Functional requirements
- Non-functional requirements

## Thiết kế
<Kiến trúc tổng quan, tham chiếu design doc>

## API / Data flow
<Input, output, schema, luồng>

## Components
<Danh sách file, vai trò từng file>

## Xử lý lỗi
<Error cases + handling>

## Kiểm tra
<Happy path, edge cases, error cases>
```

### Bước 4: Viết plan.md
Theo `docs/templates/plan.template.md`:
```markdown
# Plan: <tên feature>

## Các bước thực hiện

- [ ] Bước 1: <tên>
    - Làm gì: ...
    - File liên quan: ...

## Kiểm tra
...

## Ghi chú
...
```

### Bước 5: Viết product.md
Theo `docs/templates/product.template.md`:
```markdown
# Product: <tên feature>

## Mô tả
...

## Cách sử dụng
<Ví dụ code, các bước thao tác>

## Hành vi chi tiết
<Edge cases, special behaviors>

## Giới hạn và điều kiện
<Ràng buộc, yêu cầu hệ thống>

## Tài liệu kỹ thuật liên quan
- Spec: ...
- Design: ...
```

### Bước 6: Viết overview.md
Theo `docs/templates/overview.template.md`:
```markdown
# Overview: <tên feature>

## Tóm tắt
...

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1 | ... | ... | Không có |

## Sai lệch đáng chú ý
...

## Tài liệu liên quan
...

## Ghi chú
...
```

---

## Task 1: Project Infrastructure

**Source files cần đọc:**
- `package.json` -- dependencies, scripts, exports, peerDependencies
- `tsconfig.json` -- strict mode, target ES2022
- `tsup.config.ts` -- ESM + CJS, dts.resolve
- `eslint.config.ts` -- typescript-eslint, consistent-type-imports
- `.prettierrc` -- tabs, single quotes, trailingComma all
- `.mocharc.yml` -- tsx loader, tests timeout
- `project.xml` -- EngineVersion
- `src/index.ts` -- public exports
- `README.md` -- tổng quan dự án

**Output files:**
- `docs/designs/project-infrastructure.design.md`
- `docs/specs/project-infrastructure.spec.md`
- `docs/plans/project-infrastructure.plan.md`
- `docs/products/project-infrastructure.product.md`
- `docs/overviews/project-infrastructure.overview.md`

- [ ] **Bước 1: Đọc source code** -- đọc 8 files trên, ghi chú API export, cấu hình build, dependencies.
- [ ] **Bước 2: Viết design.md** -- theo template, tập trung giải thích vì sao dùng tsup, vì sao peer dependency playwright-core.
- [ ] **Bước 3: Viết spec.md** -- liệt kê script, dependencies, cấu trúc thư mục, build pipeline.
- [ ] **Bước 4: Viết plan.md** -- ghi lại các bước đã thực hiện (tạo package.json, tsconfig, tsup, ESLint, Mocha, index.ts).
- [ ] **Bước 5: Viết product.md** -- hướng dẫn cài đặt, yêu cầu hệ thống, ví dụ sử dụng, lifecycle table.
- [ ] **Bước 6: Viết overview.md** -- tóm tắt kết quả, bảng sai lệch, tài liệu liên quan.

---

## Task 2: Type System

**Source files cần đọc:**
- `src/types/PWChromium.ts` -- interface Chromium public API
- `src/types/fingerprint.ts` -- FingerprintOptions (PerfectCanvas, WebGL, Audio, Canvas, Battery, Sensor, HiDPI, FontPack, ElementSize)
- `src/types/proxy.ts` -- ProxyOptions (protocol, timezone, geolocation, WebRTC, DNS, tunneling, QUIC)
- `src/types/profile.ts` -- ProfileOptions (loadProxy, loadFingerprint)
- `src/types/fetch.ts` -- FetchOptions, Tag, Time

**Output files:**
- `docs/designs/type-system.design.md`
- `docs/specs/type-system.spec.md`
- `docs/plans/type-system.plan.md`
- `docs/products/type-system.product.md`
- `docs/overviews/type-system.overview.md`

- [ ] **Bước 1: Đọc code** -- 5 file types, ghi chú từng interface, field, kiểu dữ liệu.
- [ ] **Bước 2: Viết design.md** -- giải thích vì sao tách 5 file riêng, vì sao PWChromium là interface.
- [ ] **Bước 3: Viết spec.md** -- liệt kê chi tiết từng type, field, giá trị mặc định.
- [ ] **Bước 4: Viết plan.md** -- thứ tự tạo file, dependencies giữa các type.
- [ ] **Bước 5: Viết product.md** -- hướng dẫn import type, ví dụ sử dụng.
- [ ] **Bước 6: Viết overview.md** -- kết quả, sai lệch.

---

## Task 3: Error Hierarchy

**Source files:**
- `src/plugin/errors.ts` -- PluginError, MissingKeyError, InvalidEngineError, EngineTimeoutError, RequestTimeoutError

**Output files:**
- `docs/designs/error-hierarchy.design.md`
- `docs/specs/error-hierarchy.spec.md`
- `docs/plans/error-hierarchy.plan.md`
- `docs/products/error-hierarchy.product.md`
- `docs/overviews/error-hierarchy.overview.md`

- [ ] **Bước 1: Đọc code** -- `errors.ts`: class hierarchy, constructor signature.
- [ ] **Bước 2: Viết design.md** -- giải thích tại sao cần Error hierarchy thay vì Error thô.
- [ ] **Bước 3: Viết spec.md** -- liệt kệ class hierarchy, khi nào throw từng loại.
- [ ] **Bước 4: Viết plan.md** -- các bước tạo class.
- [ ] **Bước 5: Viết product.md** -- hướng dẫn catch error theo từng loại, ví dụ code.
- [ ] **Bước 6: Viết overview.md** -- kết quả, sai lệch.

---

## Task 4: RemoteEngine

**Source files:**
- `src/plugin/connector/engine.ts` -- RemoteEngine class (download, extract, IPC, spawn)
- `src/plugin/connector/utils.ts` -- helper functions
- `project.xml` -- EngineVersion

**Output files:**
- `docs/designs/remote-engine.design.md`
- `docs/specs/remote-engine.spec.md`
- `docs/plans/remote-engine.plan.md`
- `docs/products/remote-engine.product.md`
- `docs/overviews/remote-engine.overview.md`

- [ ] **Bước 1: Đọc code** -- `engine.ts`: lifecycle (updateMeta -> startProcess -> runFunction), events, timeout config.
- [ ] **Bước 2: Viết design.md** -- giải thích file-based IPC, checksum verify, caching metadata.
- [ ] **Bước 3: Viết spec.md** -- lifecycle chi tiết, API methods, events, error types.
- [ ] **Bước 4: Viết plan.md** -- các bước code class RemoteEngine.
- [ ] **Bước 5: Viết product.md** -- ví dụ dùng, timeout config, events, cảnh báo thời gian download.
- [ ] **Bước 6: Viết overview.md** -- kết quả, sai lệch.

---

## Task 5: API Connector

**Source files:**
- `src/plugin/connector/index.ts` -- singleton connector, async-lock, api() wrapper
- `src/plugin/connector/utils.ts` -- helpers

**Output files:**
- `docs/designs/api-connector.design.md`
- `docs/specs/api-connector.spec.md`
- `docs/plans/api-connector.plan.md`
- `docs/products/api-connector.product.md`
- `docs/overviews/api-connector.overview.md`

- [ ] **Bước 1: Đọc code** -- connector pattern, api() wrapper, auto-start PCAP, method list.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 6: PCAP Server

**Source files:**
- `src/plugin/connector/pcapServer/index.ts` -- TCP server mô phỏng PCAP

**Output files:**
- `docs/designs/pcap-server.design.md`
- `docs/specs/pcap-server.spec.md`
- `docs/plans/pcap-server.plan.md`
- `docs/products/pcap-server.product.md`
- `docs/overviews/pcap-server.overview.md`

- [ ] **Bước 1: Đọc code** -- binary commands (0x01 request ID, 0x07 heartbeat), retry port.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 7: Browser Launcher

**Source files:**
- `src/plugin/launcher/index.ts` -- spawn Chromium, detect DevTools URL, Browser interface

**Output files:**
- `docs/designs/browser-launcher.design.md`
- `docs/specs/browser-launcher.spec.md`
- `docs/plans/browser-launcher.plan.md`
- `docs/products/browser-launcher.product.md`
- `docs/overviews/browser-launcher.overview.md`

- [ ] **Bước 1: Đọc code** -- spawn logic, DevTools URL parsing, configure/close methods.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 8: Native Mutex

**Source files:**
- `src/plugin/mutex/index.ts` -- native C++ addon wrapper, resolvePackageRoot

**Output files:**
- `docs/designs/native-mutex.design.md`
- `docs/specs/native-mutex.spec.md`
- `docs/plans/native-mutex.plan.md`
- `docs/products/native-mutex.product.md`
- `docs/overviews/native-mutex.overview.md`

- [ ] **Bước 1: Đọc code** -- create() method, path resolution, win32 arch support.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 9: FingerprintPlugin

**Source files:**
- `src/plugin/index.ts` -- FingerprintPlugin class (core orchestrator)
- `src/plugin/config.ts` -- configuration conversion
- `src/plugin/browser.ts` -- browser management
- `src/plugin/utils.ts` -- helpers

**Output files:**
- `docs/designs/fingerprint-plugin.design.md`
- `docs/specs/fingerprint-plugin.spec.md`
- `docs/plans/fingerprint-plugin.plan.md`
- `docs/products/fingerprint-plugin.product.md`
- `docs/overviews/fingerprint-plugin.overview.md`

- [ ] **Bước 1: Đọc code** -- lifecycle (setup -> spawn -> configure -> cleanup), fluent methods, _launch() core.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 10: Playwright Bridge

**Source files:**
- `src/adapter/playwright/engine.ts` -- PlaywrightFingerprintPlugin bridge

**Output files:**
- `docs/designs/playwright-bridge.design.md`
- `docs/specs/playwright-bridge.spec.md`
- `docs/plans/playwright-bridge.plan.md`
- `docs/products/playwright-bridge.product.md`
- `docs/overviews/playwright-bridge.overview.md`

- [ ] **Bước 1: Đọc code** -- override launch/launchPersistentContext, validate options, filter args.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 11: BrowserEngine

**Source files:**
- `src/adapter/playwright/chromium.ts` -- BrowserEngine class, fluent API, singleton Chromium

**Output files:**
- `docs/designs/browser-engine.design.md`
- `docs/specs/browser-engine.spec.md`
- `docs/plans/browser-engine.plan.md`
- `docs/products/browser-engine.product.md`
- `docs/overviews/browser-engine.overview.md`

- [ ] **Bước 1: Đọc code** -- singleton pattern, fluent methods, launch/newContext/quit lifecycle.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 12: Cau hinh Fingerprint

**Source files:**
- `src/types/fingerprint.ts` -- FingerprintOptions
- `src/plugin/config.ts` -- xử lý fingerprint
- `src/plugin/index.ts` -- useFingerprint()

**Output files:**
- `docs/designs/fingerprint-config.design.md`
- `docs/specs/fingerprint-config.spec.md`
- `docs/plans/fingerprint-config.plan.md`
- `docs/products/fingerprint-config.product.md`
- `docs/overviews/fingerprint-config.overview.md`

- [ ] **Bước 1: Đọc code** -- các option fingerprint, cách engine áp dụng.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 13: Cau hinh Proxy

**Source files:**
- `src/types/proxy.ts` -- ProxyOptions
- `src/plugin/config.ts` -- xử lý proxy
- `src/plugin/index.ts` -- useProxy()

**Output files:**
- `docs/designs/proxy-config.design.md`
- `docs/specs/proxy-config.spec.md`
- `docs/plans/proxy-config.plan.md`
- `docs/products/proxy-config.product.md`
- `docs/overviews/proxy-config.overview.md`

- [ ] **Bước 1: Đọc code** -- proxy protocols, DNS mode, WebRTC, timezone/geo sync.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 14: Quan ly Profile

**Source files:**
- `src/adapter/playwright/data.ts` -- AdapterDataManager
- `src/plugin/index.ts` -- useProfile()
- `src/plugin/config.ts`

**Output files:**
- `docs/designs/profile-management.design.md`
- `docs/specs/profile-management.spec.md`
- `docs/plans/profile-management.plan.md`
- `docs/products/profile-management.product.md`
- `docs/overviews/profile-management.overview.md`

- [ ] **Bước 1: Đọc code** -- profile mapping (dirPath -> temp), unmap khi quit, load lại config.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 15: Quan ly Viewport

**Source files:**
- `src/adapter/playwright/utils.ts` -- setViewport, bindHooks
- `src/plugin/browser.ts`
- `src/plugin/config.ts`

**Output files:**
- `docs/designs/viewport-management.design.md`
- `docs/specs/viewport-management.spec.md`
- `docs/plans/viewport-management.plan.md`
- `docs/products/viewport-management.product.md`
- `docs/overviews/viewport-management.overview.md`

- [ ] **Bước 1: Đọc code** -- CDP resize với retries, sync availWidth/availHeight vào .ini.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 16: File Cleanup Daemon

**Source files:**
- `src/plugin/cleaner.ts` -- FileCleanupDaemon

**Output files:**
- `docs/designs/file-cleanup-daemon.design.md`
- `docs/specs/file-cleanup-daemon.spec.md`
- `docs/plans/file-cleanup-daemon.plan.md`
- `docs/products/file-cleanup-daemon.product.md`
- `docs/overviews/file-cleanup-daemon.overview.md`

- [ ] **Bước 1: Đọc code** -- proper-lockfile, timer 15s, ignore/include theo PID.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 17: Hook Binding

**Source files:**
- `src/adapter/playwright/utils.ts` -- onClose, bindHooks, setViewport

**Output files:**
- `docs/designs/hook-binding.design.md`
- `docs/specs/hook-binding.spec.md`
- `docs/plans/hook-binding.plan.md`
- `docs/products/hook-binding.product.md`
- `docs/overviews/hook-binding.overview.md`

- [ ] **Bước 1: Đọc code** -- hook proxy cho newContext/newPage/setViewportSize.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 18: Common Scripts

**Source files:**
- `src/common/index.ts` -- waitForResize, getViewport

**Output files:**
- `docs/designs/common-scripts.design.md`
- `docs/specs/common-scripts.spec.md`
- `docs/plans/common-scripts.plan.md`
- `docs/products/common-scripts.product.md`
- `docs/overviews/common-scripts.overview.md`

- [ ] **Bước 1: Đọc code** -- in-browser scripts, ResizeObserver, requestAnimationFrame.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 19: Playwright Module Loader

**Source files:**
- `src/loader/index.ts` -- Loader class
- `src/adapter/playwright/loader.ts` -- Playwright loader

**Output files:**
- `docs/designs/playwright-module-loader.design.md`
- `docs/specs/playwright-module-loader.spec.md`
- `docs/plans/playwright-module-loader.plan.md`
- `docs/products/playwright-module-loader.product.md`
- `docs/overviews/playwright-module-loader.overview.md`

- [ ] **Bước 1: Đọc code** -- resolve package, validate version >= minimum.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 20: Debug Logging

**Source files:**
- Tất cả file dùng `debugFactory()` -- kiểm tra namespace: `browser-with-fingerprints:*`

**Output files:**
- `docs/designs/debug-logging.design.md`
- `docs/specs/debug-logging.spec.md`
- `docs/plans/debug-logging.plan.md`
- `docs/products/debug-logging.product.md`
- `docs/overviews/debug-logging.overview.md`

- [ ] **Bước 1: Đọc code** -- tìm tất cả debugFactory usage, ghi chú namespace.
- [ ] **Bước 2-6: Viết 5 file tài liệu** -- theo template.

---

## Task 21: Non-feature tasks

**Gồm 4 non-feature tasks** (chỉ cần overview theo WORKFLOW, nhưng viết đủ 5 file để đồng bộ):

- `build-config-install-docs` -- Source: `package.json`, `tsup.config.ts`, `README.md`
- `format-comment-codebase` -- Source: toàn bộ source files (đã format)
- `known-issues-separate` -- Source: `docs/KNOWN_ISSUES.md`
- `quit-handle-cleanup` -- Source: `src/adapter/playwright/chromium.ts`, `src/plugin/index.ts`, `src/plugin/connector/index.ts`, `src/plugin/connector/pcapServer/index.ts`, `src/plugin/cleaner.ts`, `src/plugin/mutex/index.ts`

- [ ] **Task 21a: build-config-install-docs** -- viết 5 file tài liệu.
- [ ] **Task 21b: format-comment-codebase** -- viết 5 file tài liệu.
- [ ] **Task 21c: known-issues-separate** -- viết 5 file tài liệu.
- [ ] **Task 21d: quit-handle-cleanup** -- viết 5 file tài liệu.

---

## Kiểm tra tổng thể

- [ ] Đếm số file trong mỗi thư mục `docs/designs/`, `docs/specs/`, `docs/plans/`, `docs/products/`, `docs/overviews/` -- tối thiểu 21 file mỗi thư mục.
- [ ] Mỗi file phải có đúng section theo template tương ứng.
- [ ] Không cần chạy lint/build (tài liệu .md).

## Ghi chú

- Các tài liệu viết bằng tiếng Việt, thân thiện, dễ hiểu.
- Không dùng emoji trong tài liệu.
- Tài liệu cũ (hiện tại) sẽ bị ghi đè hoàn toàn.
- Nếu phát hiện sai lệch giữa code và tài liệu cũ, ưu tiên code là chuẩn.
