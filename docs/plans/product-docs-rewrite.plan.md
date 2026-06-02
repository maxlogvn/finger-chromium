# Product Docs Rewrite Implementation Plan

> **Goal:** Viết lại toàn bộ 20 file product docs cho tất cả tính năng, theo template chuẩn và phong cách giải thích "tại sao" bên cạnh "làm gì".

**Phạm vi:** Product docs (`docs/products/*.product.md`) — đây là tài liệu dev đọc để hiểu tính năng. Không sửa design/spec/plan/overview trong đợt này.

**Cấu trúc mỗi product doc:**
- `## Mô tả` — tính năng làm gì, vai trò trong hệ thống
- `## Cách sử dụng` — code ví dụ có import, copy-paste chạy được
- `## Hành vi chi tiết` — luồng, edge cases, giải thích "tại sao"
- `## Giới hạn và điều kiện` — ràng buộc cần biết
- `## Tài liệu kỹ thuật liên quan` — link spec, design, source

**Nhóm 1: Core + Connector (6 docs — đã tốt, chỉ review alignment)**
- browser-engine.product.md
- playwright-bridge.product.md
- fingerprint-plugin.product.md
- api-connector.product.md
- remote-engine.product.md
- pcap-server.product.md

**Nhóm 2: Browser management (4 docs — cần rewrite)**
- browser-launcher.product.md
- native-mutex.product.md
- file-cleanup-daemon.product.md
- hook-binding.product.md

**Nhóm 3: Feature configs (4 docs — cần rewrite)**
- fingerprint-config.product.md
- proxy-config.product.md
- profile-management.product.md
- viewport-management.product.md

**Nhóm 4: Utilities & infrastructure (6 docs — cần cải thiện)**
- common-scripts.product.md
- debug-logging.product.md
- error-hierarchy.product.md
- project-infrastructure.product.md
- playwright-module-loader.product.md
- type-system.product.md

---

### Task 1: Rewrite core + connector product docs (review & align)

**Files:** 6 docs (3 đã tốt, 3 cần rewrite)

**Source để đọc:**
- `src/adapter/playwright/chromium.ts`
- `src/adapter/playwright/engine.ts`
- `src/plugin/index.ts`
- `src/plugin/connector/index.ts`
- `src/plugin/connector/engine.ts`
- `src/plugin/connector/pcapServer/index.ts`
- `src/types/PWChromium.ts`

- [ ] **Step 1.1: Đọc source code connector + engine + pcap**

- [ ] **Step 1.2: Viết lại api-connector.product.md** (hiện 42 dòng)

```markdown
# Product: API Connector

## Mô tả

API Connector là lớp trung gian singleton giữa `FingerprintPlugin` và `RemoteEngine`. Nó nhận lệnh từ `FingerprintPlugin._launch()` (ví dụ `api('setup', params)`), dùng `AsyncLock` để đồng bộ, gọi `RemoteEngine.runFunction()`, và chuẩn hoá lỗi đầu ra.

Connector không tự khởi tạo engine — `RemoteEngine` được tạo một lần ở module level. PCAP server cũng tự động listen khi connector được import.

Nói ngắn gọn: Connector là "tổng đài" đảm bảo request đến engine không bị chồng chéo và lỗi được map đúng class.

## Cách sử dụng

Thông thường bạn không gọi connector trực tiếp. Nó được `FingerprintPlugin` gọi nội bộ:

```ts
// FingerprintPlugin._launch() gọi:
const result = await api('setup', {
  key: 'your-key',
  fingerprint: '...',
  proxy: 'http://user:pass@host:8080',
  profile: './profiles/user_01',
  version: '130',
});
```

Dùng trực tiếp khi cần custom flow:

```ts
import { api, cleanup, engine } from './plugin/connector';

const result = await api('setup', { key: process.env.BABLOSOFT_KEY });

// Kết thúc session
await cleanup();
```

Connector cũng export `engine` (RemoteEngine instance) để truy cập trực tiếp nếu cần.

## Hành vi chi tiết

- `AsyncLock` với key `'client'` đảm bảo chỉ một request tại một thời điểm. Engine dùng file-based IPC — request chồng lên nhau làm lẫn request/response.
- PCAP server tự động listen khi connector được import. Engine cần PCAP server để giao tiếp ID request.
- `api()` kiểm tra response có `error` không. Nếu error chứa `'key is missing'`, tự động throw `MissingKeyError`. Các lỗi khác throw `PluginError`.
- `perfectCanvasRequest` (trong `params.options`): set `requestTimeout = 0` (không timeout) vì perfect canvas request có thể mất nhiều thời gian hơn request thường.
- `cleanup()` chỉ kill engine process và close PCAP server. Cleanup mutex, cleaner, và browser nằm ở `FingerprintPlugin.cleanup()`.
- Engine events (`beforeDownload`, `beforeExtract`) được log ra console để user biết tiến trình.

## Giới hạn và điều kiện

- `FINGERPRINT_CWD` và `FINGERPRINT_TIMEOUT` đọc từ env. Nếu không set, dùng giá trị mặc định của `RemoteEngine`.
- Chỉ một request được xử lý tại một thời điểm (do async-lock).
- Cần gọi `cleanup()` khi kết thúc session để kill engine process và close PCAP server.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/api-connector.spec.md`
- Design: `docs/designs/api-connector.design.md`
- Source: `src/plugin/connector/index.ts`
```

- [ ] **Step 1.3: Viết lại remote-engine.product.md** (hiện 60 dòng)

```markdown
# Product: RemoteEngine

## Mô tả

`RemoteEngine` quản lý toàn bộ vòng đời của engine binary (`FastExecuteScript.exe`). Đây là lớp thấp nhất trong stack fingerprint — nó tải engine từ bablosoft.com, verify checksum SHA1, giải nén, spawn process, và giao tiếp qua file-based IPC.

Không có `RemoteEngine`, các lớp trên (`API Connector`, `FingerprintPlugin`) không thể gửi lệnh setup fingerprint hay nhận kết quả.

## Cách sử dụng

Thông thường bạn không tạo `RemoteEngine` trực tiếp. `API Connector` tạo sẵn một instance singleton:

```ts
import RemoteEngine from './plugin/connector/engine';

const engine = new RemoteEngine({
  cwd: './data',
  engineTimeout: 300_000,   // timeout khởi động
  requestTimeout: 300_000,  // timeout chờ phản hồi
});

engine.on('beforeDownload', () => console.log('Đang tải engine...'));
engine.on('beforeExtract', () => console.log('Đang giải nén engine...'));

const result = await engine.runFunction('setup', {
  key: 'your-key',
  fingerprint: '...',
});
```

## Hành vi chi tiết

### File-based IPC

Engine giao tiếp qua file JSON — không dùng pipe hay socket:

1. `runFunction()` tạo thư mục `r/` trong thư mục script engine.
2. Ghi file `<pid>_<uuid>.json` chứa `{ name, params }`.
3. `chokidar` watch file đó cho đến khi engine ghi response vào.
4. Đọc response, parse JSON, trả kết quả.
5. Dọn file request cũ (process không còn tồn tại) trước mỗi request mới.

Cơ chế file-based được chọn vì engine binary (C/C++) không support stdin/stdout JSON protocol — file là cách đơn giản nhất để hai process giao tiếp.

### Download và checksum

- Đọc `EngineVersion` từ `project.xml` trong package root.
- Fetch metadata từ `bablosoft.com/distr/FastExecuteScript<arch>/<version>/...meta.json`.
- Cache metadata dưới dạng `<version>_<arch>.json` để tránh request lại.
- Download zip, verify SHA1 checksum, nếu sai thì xoá và tải lại.
- Extract zip vào thư mục `script/<version>/`.

### Timeout

| Hằng | Giá trị | Mục đích |
|---|---|---|
| `DEFAULT_TIMEOUT` | 300,000 ms (5 phút) | Timeout mặc định cho khởi động + request |
| `CLOSE_TIMEOUT` | 60,000 ms (1 phút) | Chờ engine process đóng sau khi spawn |

### Package root resolution

`resolvePackageRoot()` walk ngược thư mục từ `__dirname` cho đến khi tìm thấy `package.json` có `name === 'fingerprint-chromium-engine'`. Cần thiết vì sau tsup bundle, đường dẫn `__dirname` có thể khác với cấu trúc source.

## API methods

| Method | Mô tả |
|---|---|
| `runFunction(name, params, opts?)` | Gọi hàm trên engine, trả `FunctionResult` |
| `kill()` | Kill engine process, an toàn khi gọi nhiều lần |
| `setCwd(value?)` | Set thư mục làm việc |
| `setArgs(value?)` | Set tham số dòng lệnh cho engine |
| `setEngineTimeout(value?)` | Timeout khởi động (ms) |
| `setRequestTimeout(value?)` | Timeout chờ response (ms) |

## Giới hạn và điều kiện

- Yêu cầu kết nối internet cho lần chạy đầu (tải engine).
- `project.xml` phải tồn tại trong package root.
- Chỉ hỗ trợ Windows (`FastExecuteScript.exe`).
- `ARCH` tự động phát hiện: `'32'` nếu process arch chứa `'32'`, `'64'` nếu không.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/remote-engine.spec.md`
- Design: `docs/designs/remote-engine.design.md`
- Source: `src/plugin/connector/engine.ts`
```

- [ ] **Step 1.4: Viết lại pcap-server.product.md** (hiện 33 dòng)

```markdown
# Product: PCAP Server

## Mô tả

PCAP Server là một TCP server tối giản mô phỏng PCAP interface. Engine binary (`FastExecuteScript.exe`) cần server này để gửi và nhận ID request — đây là một phần của cơ chế đồng bộ giữa Node.js process và engine process.

PCAP ở đây không phải packet capture. Tên này giữ từ code gốc của BAS (Browser Automation Studio).

## Cách sử dụng

PCAP server được auto-start khi `connector/index.ts` được import. Bạn không cần khởi động thủ công:

```ts
import * as pcapServer from './plugin/connector/pcapServer';

// Khởi động trên port cụ thể
const port = await pcapServer.listen(0, '127.0.0.1');

// Dừng khi cleanup
await pcapServer.close();
```

## Hành vi chi tiết

- Server chỉ hiểu 2 lệnh binary:
  - `0x01` (Request ID): engine yêu cầu một ID mới — server phản hồi với ID dạng số.
  - `0x07` (Heartbeat): engine kiểm tra server còn sống — server phản hồi xác nhận.
- `listen()` dùng `once()` — chỉ gọi được một lần, các lần sau ignore.
- Nếu port đã được dùng (EADDRINUSE), retry sau 1 giây với port mới.
- `close()` kiểm tra server tồn tại trước khi đóng — an toàn khi gọi nhiều lần.
- Port được dùng để set `--mock-pcap-port=<port>` cho engine args.

## Giới hạn và điều kiện

- Chỉ hỗ trợ 2 lệnh binary (`0x01`, `0x07`).
- Server listen trên `127.0.0.1` (localhost) — không expose ra ngoài.
- Không liên quan đến PCAP network capture thật.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/pcap-server.spec.md`
- Design: `docs/designs/pcap-server.design.md`
- Source: `src/plugin/connector/pcapServer/index.ts`
```

- [ ] **Step 1.5: Review alignment 3 core docs** (browser-engine, playwright-bridge, fingerprint-plugin — đã tốt, chỉ kiểm tra consistency với connector layer, sửa nếu cần)

---

### Task 2: Rewrite browser management product docs (4 docs)

**Source cần đọc:**
- `src/plugin/launcher/index.ts`
- `src/plugin/mutex/index.ts`
- `src/plugin/cleaner.ts`
- `src/adapter/playwright/utils.ts`

- [ ] **Step 2.1: Đọc source code launcher, mutex, cleaner, utils**

- [ ] **Step 2.2: Viết lại browser-launcher.product.md** (hiện 37 dòng)

```markdown
# Product: Browser Launcher

## Mô tả

`Browser Launcher` có nhiệm vụ spawn Chromium `worker.exe` và phát hiện DevTools listening URL từ output của process. Đây là lớp thấp nhất trong chuỗi launch — sau khi `FingerprintPlugin._launch()` gọi `api('setup')` để engine chuẩn bị cấu hình, nó dùng launcher này để thực sự mở browser.

## Cách sử dụng

Trong luồng thông thường, bạn không gọi launcher trực tiếp. Nó được `FingerprintPlugin._launch()` gọi nội bộ.

Dùng trực tiếp khi cần debug hoặc custom:

```ts
import { launch } from './plugin/launcher';

const browser = await launch({
  executablePath: './path/to/worker.exe',
  debuggingPort: 9222,
  args: ['--window-size=1280,720', '--parent-process-id=12345'],
});

console.log('DevTools URL:', browser.url);
await browser.close();
```

## Hành vi chi tiết

- `launch()` spawn `worker.exe` và parse dòng đầu tiên khớp `DevTools listening on <url>` từ stderr/stdout.
- Nếu không tìm thấy URL sau 30 giây, throw error.
- `close()` dùng `taskkill /pid <pid> /T /F` (Windows) để kill toàn bộ process tree — đảm bảo không còn child process sống sót.
- `configure()` là no-op — chỉ để tương thích với interface `Browser`.

```ts
interface Browser {
  url: string;
  close: () => Promise<void>;
  configure: () => Promise<void>;
}
```

## Giới hạn và điều kiện

- Chỉ hoạt động trên Windows (dùng `taskkill`).
- Cần `executablePath` trỏ đến `worker.exe` hợp lệ.
- `close()` dùng `SIGKILL` tương đương — process không có cơ hội cleanup.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/browser-launcher.spec.md`
- Design: `docs/designs/browser-launcher.design.md`
- Source: `src/plugin/launcher/index.ts`
```

- [ ] **Step 2.3: Viết lại native-mutex.product.md** (hiện 32 dòng)

```markdown
# Product: Native Mutex

## Mô tả

Native Mutex cung cấp Windows named mutex thông qua C++ addon (`mutex.node`). Mutex này cần cho `worker.exe` (BAS process) để đồng bộ truy cập tài nguyên dùng chung giữa các process.

## Cách sử dụng

```ts
import { create, release } from './plugin/mutex';

// Tạo mutex với tên unique
create('BASProcess12345');

// worker.exe dùng mutex này để đồng bộ
// ...

// Giải phóng mutex
release('BASProcess12345');
```

## Hành vi chi tiết

- `create(name)` tạo kernel-level named mutex trên Windows. Mutex có tên duy nhất để tránh xung đột giữa các instance.
- `release(name)` gọi native close handle. Nếu native chưa hỗ trợ close, `release()` là no-op.
- Windows kernel tự động cleanup handle mutex khi process thoát — không lo memory leak nếu quên release.
- Nếu architecture (32-bit/64-bit) không có file `mutex.node` tương ứng, throw error rõ ràng.

## Giới hạn và điều kiện

- Chỉ chạy trên Windows (win32).
- Cần file `mutex.node` phù hợp với architecture (32-bit hoặc 64-bit).
- File `mutex.node` được resolve từ `__dirname` — cần đúng path sau khi tsup bundle (xem KNOWN_ISSUES.md #6).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/native-mutex.spec.md`
- Design: `docs/designs/native-mutex.design.md`
- Source: `src/plugin/mutex/index.ts`
```

- [ ] **Step 2.4: Viết lại file-cleanup-daemon.product.md** (hiện 41 dòng)

```markdown
# Product: File Cleanup Daemon

## Mô tả

File Cleanup Daemon tự động dọn dẹp file tạm do engine tạo ra (file `.ini`, process files). Nó chạy timer 15 giây quét thư mục engine, kiểm tra file nào còn được lock bởi process đang chạy, và chỉ xoá file đã hết hạn và không còn lock.

Mục đích: engine tạo nhiều file tạm trong quá trình hoạt động (settings, process tracking). Nếu không dọn, thư mục engine phình to theo thời gian.

## Cách sử dụng

Daemon hoạt động tự động — không cần cấu hình thủ công:

```ts
// Khi _launch() được gọi:
// 1. cleaner.watch(enginePwd) — đăng ký thư mục, khởi động timer
// 2. cleaner.ignore(pwd, pid, id) — lock file tạm
//
// Khi configure() được gọi:
// 3. cleaner.include(pwd, pid, id) — unlock file
//
// Khi cleanup() được gọi:
// 4. cleaner.stop() — clear timer, unlock toàn bộ
```

## Hành vi chi tiết

- Timer 15 giây chạy `.unref()` — không block Node.js process exit.
- Mỗi lần tick: quét thư mục `{t,s}/*`, kiểm tra mtime > 15 giây, kiểm tra lock (proper-lockfile), xoá file không lock.
- `ignore()` lock các file: `t/{pid}`, `s/{id}.ini`, `s/{id}1.ini`.
- `include()` unlock — gọi từ `configure()` khi engine đã setup xong.
- `stop()` clear timer và unlock toàn bộ file còn locked — gọi từ `cleanup()`.
- Debug log namespace: `browser-with-fingerprints:cleaner`.

## Giới hạn và điều kiện

- File không lock và mtime > 15 giây sẽ bị xoá vĩnh viễn.
- Yêu cầu quyền đọc/ghi trên thư mục engine.
- Chỉ hỗ trợ Windows (engine path là Windows path).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/file-cleanup-daemon.spec.md`
- Design: `docs/designs/file-cleanup-daemon.design.md`
- Source: `src/plugin/cleaner.ts`
```

- [ ] **Step 2.5: Viết lại hook-binding.product.md** (hiện 67 dòng — decent nhưng có thể cải thiện)

```markdown
# Product: Hook Binding

## Mô tả

Hook Binding intercept (chặn và can thiệp) các method Playwright để tự động resize viewport và chặn thay đổi kích thước sau khi fingerprint đã set. Khi bạn gọi `context.newPage()`, viewport tự động được resize về kích thước fingerprint — không cần gọi `page.setViewportSize()` thủ công.

## Cách sử dụng

Hook Binding tích hợp sẵn vào `PlaywrightFingerprintPlugin`:

```ts
const context = await Chromium.newContext();
const page = await context.newPage();
// Page tự động resize về kích thước fingerprint
```

Đăng ký cleanup handler:

```ts
import { onClose } from './adapter/playwright/utils';

onClose(browser, () => cleanup());
// Browser: 'disconnected' event
// BrowserContext: 'close' event
```

## Hành vi chi tiết

### Proxy chain

```
Browser.newContext()
  -> force viewport: null (chống Playwright tự resize trước)
  -> patch context

BrowserContext.newPage()
  -> onPageCreated hook -> CDP resize theo fingerprint
  -> patch page

Page.setViewportSize()
  -> bị chặn -> in warning
```

### Chặn setViewportSize

```ts
await page.setViewportSize({ width: 800, height: 600 });
// Warning: "[Fingerprint] Không thể thay đổi viewport:
// kích thước đã bị khoá bởi fingerprint."
```

Không throw error vì throw có thể crash luồng code của user. Warning đủ để user biết.

### Fallback cho launchPersistentContext

Nếu dùng `launchPersistentContext()`, `bindHooks()` nhận `BrowserContext` trực tiếp và gọi `patchContext()` ngay, không qua proxy `newContext()`.

### Resize page đầu tiên

`configure()` trong engine.ts resize page đầu tiên (nếu context đã có page) ngay sau khi bind hooks. CDP resize với retries (tối đa 3 lần) và delta correction.

## Giới hạn và điều kiện

- Hook chỉ áp dụng cho Pages mới (tạo sau khi bind hooks). Pages đã tồn tại trước đó không tự động resize.
- `viewport: null` force — nếu user truyền `viewport` trong options, nó bị override silently.
- `patchPage` chỉ warning, không throw — user không biết viewport đã bị lock trừ khi mở console.
- Phụ thuộc Playwright internal API. Nếu Playwright thay đổi method signature, proxy chain fail âm thầm.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/hook-binding.spec.md`
- Design: `docs/designs/hook-binding.design.md`
- Source: `src/adapter/playwright/utils.ts`
```

---

### Task 3: Rewrite feature config product docs (4 docs)

**Source cần đọc:**
- `src/plugin/config.ts`
- `src/plugin/browser.ts`
- `src/adapter/playwright/data.ts`
- `src/common/index.ts`

- [ ] **Step 3.1: Đọc source code cho config, browser, data, common**

- [ ] **Step 3.2: Viết lại fingerprint-config.product.md** (hiện 38 dòng)

```markdown
# Product: Cấu hình Fingerprint

## Mô tả

Tính năng fingerprint cho phép gắn fingerprint thật vào browser Chromium thông qua `useFingerprint(data, options)`. Data là JSON string từ service (lấy qua `fetch()` hoặc `newFingerprint()`), options kiểm soát từng kỹ thuật giả lập như WebGL noise, Canvas noise, PerfectCanvas, Battery API, Sensor API,...

Tất cả fingerprint được inject ở tầng C/C++ trước khi Chromium khởi động — không có dấu hiệu override trong JavaScript context.

## Cách sử dụng

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const fingerprintData = await Chromium.newFingerprint({
  tags: ['Microsoft Windows', 'Chrome'],
});

await Chromium
  .useFingerprint(fingerprintData, {
    usePerfectCanvas: true,       // canvas chính xác (mạnh nhất)
    safeWebGL: true,              // nhiễu WebGL
    safeAudio: true,              // nhiễu Audio API
    safeCanvas: true,             // nhiễu Canvas 2D
    safeBattery: true,            // giả lập Battery API
    emulateDeviceScaleFactor: true, // HiDPI/Retina
    emulateSensorAPI: true,       // Sensor API (di động)
    useFontPack: true,            // đồng bộ font
    safeElementSize: false,       // che giấu element coordinates
  })
  .launch()
  .newContext();
```

## Hành vi chi tiết

- `data` phải là JSON string từ fingerprint service. Engine parse và inject ở native layer.
- Options được validate: `data` phải là string, `options` phải là object không null.
- `usePerfectCanvas`: thay thế toàn bộ Canvas data bằng bản chính xác từ fingerprint thật — kỹ thuật mạnh nhất nhưng cần fingerprint có PerfectCanvas data.
- `safeElementSize` mặc định `false`: che giấu tọa độ DOM element là kỹ thuật nặng, không cần thiết cho mọi use case. Chỉ bật khi cần chống ClientRects fingerprinting.
- `useFontPack`: engine đồng bộ danh sách font với fingerprint — tránh bị phát hiện qua `window.fonts` khác biệt.

## Giới hạn và điều kiện

- `useFontPack` cần FontPack đã cài trên hệ thống.
- `usePerfectCanvas` yêu cầu fingerprint chứa PerfectCanvas data.
- Nếu không gọi `useFingerprint`, engine vẫn launch với fingerprint mặc định.
- Không thể thay đổi options sau khi `launch()` đã gọi.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/fingerprint-config.spec.md`
- Design: `docs/designs/fingerprint-config.design.md`
- Source: `src/plugin/config.ts`
```

- [ ] **Step 3.3: Viết lại proxy-config.product.md** (hiện 48 dòng)

```markdown
# Product: Cấu hình Proxy

## Mô tả

Tính năng proxy định tuyến toàn bộ traffic trình duyệt qua HTTP/HTTPS/SOCKS4/SOCKS5 proxy. Engine tự động đồng bộ timezone, geolocation, ngôn ngữ, WebRTC, DNS theo IP của proxy. Tất cả xử lý ở tầng C/C++ — không có dấu vết trong JavaScript context.

## Cách sử dụng

```ts
import { Chromium } from 'fingerprint-chromium-engine';

await Chromium
  .useProxy('http://user:pass@192.168.1.1:8080', {
    changeTimezone: true,         // đồng bộ timezone theo IP proxy
    changeGeolocation: true,      // đồng bộ vị trí địa lý
    changeBrowserLanguage: true,  // đồng bộ Accept-Language
    changeWebRTC: 'replace',      // thay IP WebRTC bằng IP proxy
    dnsMode: 'custom-direct',     // DNS tuỳ chỉnh
    dnsIP: '1.1.1.1',
  })
  .launch()
  .newContext();
```

Proxy không auth:

```ts
.useProxy('socks5://192.168.1.1:1080')
```

Proxy cũng có thể được trích xuất từ Playwright launch options (nếu không gọi `useProxy()`).

## Hành vi chi tiết

| Option | Mặc định | Giải thích |
|---|---|---|
| `changeBrowserLanguage` | `true` | Đổi `Accept-Language` và `navigator.language` theo quốc gia IP proxy. |
| `changeGeolocation` | `false` | Nếu tắt, browser từ chối mọi yêu cầu truy cập vị trí. |
| `changeWebRTC` | `'replace'` | Thay IP trong WebRTC bằng IP proxy. Cấu hình riêng IPv4/IPv6 public và private. |
| `dnsMode` | `'system-proxy'` | `'custom-direct'`: DNS tuỳ chỉnh với traffic qua proxy. `'custom-proxy'`: DNS qua proxy (yêu cầu proxy hỗ trợ UDP). |
| `enableTunneling` | `true` | Nếu `false`, proxy không hoạt động — dùng khi đã có VPN hoặc muốn kết nối trực tiếp. |
| `enableQUIC` | `false` | Chỉ bật nếu proxy server hỗ trợ UDP. |

## Giới hạn và điều kiện

- Proxy URL phải đúng format: `protocol://user:pass@host:port` (có auth) hoặc `protocol://host:port` (không auth).
- Chỉ hỗ trợ Windows 32-bit và 64-bit.
- Engine tự kiểm tra proxy — nếu không hoạt động, `_launch()` throw error.
- `dnsMode: 'custom-proxy'` yêu cầu proxy hỗ trợ UDP.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/proxy-config.spec.md`
- Design: `docs/designs/proxy-config.design.md`
- Source: `src/plugin/config.ts`
```

- [ ] **Step 3.4: Viết lại profile-management.product.md** (hiện 50 dòng)

```markdown
# Product: Quản lý Profile

## Mô tả

Tính năng profile cho phép lưu và tái sử dụng dữ liệu trình duyệt (cookie, localStorage, session) giữa các lần chạy. Profile được copy vào thư mục tạm trước khi browser khởi động — tránh corrupt dữ liệu gốc — và được sao lưu lại sau khi kết thúc session.

## Cách sử dụng

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const context = await Chromium
  .useProfile('./profiles/user_01', {
    loadProxy: true,        // tự động load proxy từ profile cũ
    loadFingerprint: true,  // tự động load fingerprint từ profile cũ
  })
  .launch()
  .newContext();

// ... dùng browser ...

// Tự động lưu profile khi quit
await Chromium.quit();

// Hoặc lưu vào đường dẫn khác
await Chromium.quit('./backup/profile_backup');
```

## Hành vi chi tiết

1. **Khi `launch()`:** Profile gốc được copy vào temp dir với tên duy nhất (timestamp + random hex). Browser chạy trên bản copy này.
2. **Trong khi chạy:** Mọi thay đổi (cookie, localStorage) chỉ ảnh hưởng đến bản copy — profile gốc không bị ảnh hưởng.
3. **Khi `quit()`:** Context được close. Profile từ temp dir copy ngược về thư mục gốc (hoặc thư mục chỉ định trong `saveDataPath`). Temp dir bị xoá.
4. **Load lại:** `loadProxy: true` và `loadFingerprint: true` (mặc định) — engine đọc proxy và fingerprint đã dùng lần trước từ profile và tự động áp dụng.

`AdapterDataManager` trong `src/adapter/playwright/data.ts` quản lý quá trình map/unmap profile. Nó dùng temp dir để tránh corrupt — nếu browser crash trong lúc chạy, profile gốc vẫn còn nguyên.

## Giới hạn và điều kiện

- Mỗi instance chỉ dùng một profile.
- Profile chỉ được lưu khi gọi `quit()`. Nếu process bị kill, dữ liệu trong temp dir sẽ mất.
- Yêu cầu quyền đọc/ghi trên thư mục profile.
- Chỉ hỗ trợ Windows.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/profile-management.spec.md`
- Design: `docs/designs/profile-management.design.md`
- Source: `src/adapter/playwright/data.ts`
```

- [ ] **Step 3.5: Viết lại viewport-management.product.md** (hiện 39 dòng)

```markdown
# Product: Quản lý Viewport

## Mô tả

Tính năng tự động đặt kích thước viewport cho browser dựa trên fingerprint. Dùng CDP (Chrome DevTools Protocol) để resize với cơ chế retry (tối đa 3 lần) và delta correction để đảm bảo độ chính xác đến từng pixel.

Sau khi viewport đã set, `page.setViewportSize()` bị chặn — tránh thay đổi viewport làm fingerprint lệch.

## Cách sử dụng

Viewport tự động set khi gọi `launch()` và `newContext()` — không cần cấu hình thủ công:

```ts
const context = await Chromium
  .useFingerprint(fingerprintData)
  .launch()
  .newContext();
// Viewport tự động resize theo fingerprint
```

Nếu không có fingerprint, dùng kích thước từ `defaultViewport` option:

```ts
const context = await Chromium
  .launch({ viewport: { width: 1920, height: 1080 } })
  .newContext();
```

## Hành vi chi tiết

- Resize qua CDP: kết nối CDP session, lấy windowId, gọi `Browser.setWindowBounds`, chờ resize hoàn tất qua `waitForResize` script, kiểm tra lại kích thước.
- Delta correction: nếu viewport sai lệch (do khung viền, DPI scaling), tự động tính delta và thử lại với kích thước đã điều chỉnh.
- Retry tối đa 3 lần. Nếu vẫn không chính xác, ghi warning và tiếp tục — không block user.
- `setViewportSize()` của Page bị chặn qua proxy — in warning thay vì throw.
- `availWidth`/`availHeight` được đồng bộ vào `.ini` file của engine để fingerprint service biết kích thước màn hình thật.

## Giới hạn và điều kiện

- Yêu cầu CDP port accessible (engine mở CDP tự động).
- Resize chính xác phụ thuộc vào DPI scaling và loại màn hình.
- Nếu không thể đặt viewport chính xác sau 3 lần, chấp nhận sai số (cảnh báo console).
- Chỉ hỗ trợ Windows.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/viewport-management.spec.md`
- Design: `docs/designs/viewport-management.design.md`
- Source: `src/adapter/playwright/utils.ts`, `src/plugin/browser.ts`
```

---

### Task 4: Rewrite utilities & infrastructure product docs (6 docs)

**Source cần đọc:**
- `src/common/index.ts`
- `src/loader/index.ts`
- `src/adapter/playwright/loader.ts`
- `src/plugin/errors.ts`
- `src/types/*.ts`
- package.json

- [ ] **Step 4.1: Đọc source code common, loader, errors, types**

- [ ] **Step 4.2: Viết lại common-scripts.product.md** (hiện 40 dòng)

```markdown
# Product: Common Scripts

## Mô tả

Common Scripts cung cấp 2 hàm JavaScript chạy trong browser qua `page.evaluate()` hoặc CDP `Runtime.evaluate`. Các script này hỗ trợ resize viewport — được dùng nội bộ bởi `BrowserEngine` khi thay đổi kích thước viewport theo fingerprint.

## Cách sử dụng

```ts
import { scripts } from './src/common';

// Playwright context
await page.evaluate(scripts.waitForResize);
const vp = await page.evaluate(scripts.getViewport);

// CDP context
await cdp.Runtime.evaluate({
  expression: `(${scripts.waitForResize})()`,
  awaitPromise: true,
});
```

## Hành vi chi tiết

- `waitForResize`: ResizeObserver detect thay đổi kích thước → disconnect ngay (tránh memory leak) → double `requestAnimationFrame` (lần 1 layout, lần 2 paint).
- `getViewport`: dùng `window.innerWidth` thay `clientWidth`. Lý do: fingerprint service dùng `innerWidth` (bao gồm scrollbar) để xác định viewport.
- Scripts được lưu dạng function object. Khi dùng với CDP, gọi `.toString()` để serialize thành string.
- Closure variables không được capture — mọi thứ trong function body. Điều này đảm bảo script hoạt động đúng khi evaluate ở remote context.

## Giới hạn và điều kiện

- `waitForResize` treo vô hạn nếu không có resize — cần timeout ở caller.
- Chỉ gọi scripts sau khi page đã load (`DOMContentLoaded`).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/common-scripts.spec.md`
- Design: `docs/designs/common-scripts.design.md`
- Source: `src/common/index.ts`
```

- [ ] **Step 4.3: Viết lại debug-logging.product.md** (hiện 55 dòng — decent, cải thiện nhẹ)

```markdown
# Product: Debug Logging

## Mô tả

Debug logging dùng thư viện `debug` với namespace theo từng module. Dễ bật/tắt qua biến môi trường `DEBUG`. Zero overhead khi không dùng — `debug` package tự động tắt khi không có namespace match.

## Cách sử dụng

```bash
# Windows CMD
set DEBUG=browser-with-fingerprints:* & node app.js

# PowerShell
$env:DEBUG='browser-with-fingerprints:*'
node app.js
```

Chỉ một namespace:

```bash
set DEBUG=browser-with-fingerprints:connector & node app.js
```

Nhiều namespace:

```bash
set DEBUG=browser-with-fingerprints:connector,browser-with-fingerprints:cleaner & node app.js
```

## Hành vi chi tiết

### Namespaces

| Namespace | Log gì | File source |
|---|---|---|
| `browser-with-fingerprints:connector` | API Connector, PCAP server start | `connector/index.ts` |
| `browser-with-fingerprints:connector:engine` | Engine download, extract, IPC request/response | `connector/engine.ts` |
| `browser-with-fingerprints:connector:pcapServer` | PCAP server lifecycle | `connector/pcapServer/index.ts` |
| `browser-with-fingerprints:cleaner` | File cleanup daemon | `plugin/cleaner.ts` |

### Ví dụ output

```
browser-with-fingerprints:connector:engine Dang tai browser... +0ms
browser-with-fingerprints:connector:engine Engine giai nen thanh cong... +5342ms
browser-with-fingerprints:connector:engine Dang goi method "setup"... +10234ms
browser-with-fingerprints:connector PCAP server dang lang nghe tai port 54321 +11000ms
```

## Giới hạn và điều kiện

- Log ra **stderr**, không phải stdout.
- Không hỗ trợ file transport — chỉ output terminal.
- Trên Windows: dùng `set` (cmd) hoặc `$env:DEBUG` (PowerShell). `export` không hoạt động.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/debug-logging.spec.md`
- Design: `docs/designs/debug-logging.design.md`
- Source: toàn bộ file dùng `debugFactory`
```

- [ ] **Step 4.4: Viết lại error-hierarchy.product.md** (hiện 72 dòng — decent, cập nhật chi tiết)

```markdown
# Product: Hệ thống lỗi (Error Hierarchy)

## Mô tả

5 error class dành riêng cho engine, kế thừa từ `PluginError` base. Mỗi class tự động thêm hướng dẫn khắc phục vào message (dùng `dedent` để giữ format).

```
PluginError (base)
├── MissingKeyError      — thiếu key bảo mật
├── InvalidEngineError   — engine chưa tải/giải nén
├── EngineTimeoutError   — timeout khởi động engine
└── RequestTimeoutError  — timeout chờ response
```

## Cách sử dụng

Hiện tại errors chưa được export public (xem KNOWN_ISSUES.md #2). Dùng `err.name` để phân biệt:

```ts
try {
  await Chromium.launch();
} catch (err: unknown) {
  if (err instanceof Error) {
    switch (err.name) {
      case 'MissingKeyError':
        console.error('Thiếu key:', err.message);
        break;
      case 'InvalidEngineError':
        console.error('Engine lỗi:', err.message);
        break;
      case 'EngineTimeoutError':
      case 'RequestTimeoutError':
        console.error('Timeout:', err.message);
        break;
      default:
        console.error('Lỗi engine:', err.message);
    }
  }
}
```

## Hành vi chi tiết

| Error class | Khi nào xảy ra | Message gợi ý thêm |
|---|---|---|
| `MissingKeyError` | `serviceKey` chưa set khi gọi fetch/setup | "bạn cần chỉ định key không chỉ khi nhận fingerprint, mà cả khi áp dụng nó vào browser" |
| `InvalidEngineError` | Engine chưa tải hoặc giải nén lỗi | "xoá engine folder, chạy lại, mở issue nếu còn lỗi" |
| `EngineTimeoutError` | startProcess quá thời gian | "dùng `setEngineTimeout()` để tăng timeout" |
| `RequestTimeoutError` | runFunction quá thời gian | "dùng `setRequestTimeout()` để tăng timeout" |

### Tại sao dùng `dedent`

Message lỗi viết trong code dạng template string nhiều dòng. `dedent` loại bỏ khoảng trắng thừa ở đầu mỗi dòng — giúp code dễ đọc và output lỗi gọn gàng.

### Tại sao dùng `captureStackTrace`

`captureStackTrace` (V8 API) loại bỏ constructor khỏi stack trace — stack trace ngắn hơn, tập trung vào code gây lỗi thay vì dòng new Error().

### Tại sao dùng `Symbol.toStringTag`

Cho phép `Object.prototype.toString.call(err)` trả về `[object MissingKeyError]` thay vì `[object Error]`. Hữu ích khi debug trong các framework log tự động gọi `.toString()`.

## Giới hạn và điều kiện

- Chưa thể import errors từ package (KNOWN_ISSUES.md #2). Dùng `err.name` thay thế.
- `instanceof PluginError` hiện không hoạt động nếu import từ package.
- Tất cả message lỗi viết bằng tiếng Việt.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/error-hierarchy.spec.md`
- Design: `docs/designs/error-hierarchy.design.md`
- Source: `src/plugin/errors.ts`
```

- [ ] **Step 4.5: Viết lại project-infrastructure.product.md** (hiện 58 dòng)

```markdown
# Product: Hạ tầng dự án (Project Infrastructure)

## Mô tả

`fingerprint-chromium-engine` là thư viện Node.js giúp điều khiển Chromium qua Playwright với fingerprint thật, bypass bot detection. Fingerprint được inject ở tầng C/C++ trước khi browser khởi động — không có dấu hiệu override trong JavaScript context.

Chỉ hỗ trợ Windows 32-bit và 64-bit.

## Cách sử dụng

### Cài đặt

```bash
npm install github:maxlogvn/finger-chromium
npm install playwright-core   # peer dependency
npx playwright install chromium
```

### Ví dụ nhanh

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const fingerprintData = await Chromium.newFingerprint({
  tags: ['Microsoft Windows', 'Chrome'],
});

const context = await Chromium
  .useFingerprint(fingerprintData, { safeWebGL: true })
  .launch({ headless: false })
  .newContext();

const page = await context.newPage();
await page.goto('https://example.com');

await Chromium.quit();
```

### Các lệnh phát triển

| Lệnh | Mô tả |
|---|---|
| `npm run lint` | ESLint |
| `npm run format` | Prettier format |
| `npm test` | Mocha tests (cần browser thật) |
| `npm run build` | Build ESM + CJS + DTS qua tsup |
| `npm run clean` | Xoá dist (tsup --clean, Windows-compatible) |

## Hành vi chi tiết

- `launch()` chỉ gọi được một lần. Gọi lần 2 throw error.
- `newContext()` chỉ gọi được sau `launch()`, trước `quit()`.
- `quit()` dọn dẹp context, profile, engine process, PCAP server, mutex, cleaner.
- `headless: false` mặc định — fingerprint check phát hiện headless mode.

## Giới hạn và điều kiện

- Node.js >= 18, Windows (win32) 32-bit hoặc 64-bit.
- `playwright-core` >= 1.60 (peer dependency — phải tự cài).
- Biến môi trường bắt buộc: `BABLOSOFT_KEY`. Tuỳ chọn: `BROWSER_RUNNING_DIR`, `ENGINE_WORKING_DIR`.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/project-infrastructure.spec.md`
- Design: `docs/designs/project-infrastructure.design.md`
- Source: `src/index.ts`
```

- [ ] **Step 4.6: Viết lại playwright-module-loader.product.md** (hiện 43 dòng)

```markdown
# Product: Playwright Module Loader

## Mô tả

Loader tự động tìm kiếm Playwright trong `node_modules`, hỗ trợ cả `playwright` (bản đầy đủ) lẫn `playwright-core` (bản nhẹ). Nếu không tìm thấy hoặc version không đạt tối thiểu, throw error hướng dẫn cài đặt.

## Cách sử dụng

```ts
import defaultLoader from './adapter/playwright/loader';
// Tự động resolve: thử 'playwright' -> 'playwright-core'
const browserType = defaultLoader.load<'chromium'>('chromium');
// browserType là Playwright BrowserType.chromium
```

Cài đặt Playwright:

```bash
# Option 1: Bản đầy đủ (recommended)
npm install playwright

# Option 2: Chỉ core (nhẹ hơn)
npm install playwright-core
```

## Hành vi chi tiết

Quy trình resolve:

1. Thử `require('playwright')` — nếu có (bản đầy đủ), dùng luôn.
2. Nếu không, thử `require('playwright-core')` — bản nhẹ hơn.
3. Kiểm tra version >= **1.27.1** (so sánh bằng `compare-versions`).
4. Trả về `module.chromium` (BrowserType cho Chromium).
5. Nếu property `chromium` không tồn tại, trả về toàn bộ module (fallback cho cấu trúc module lạ).

Loader class trong `src/loader/index.ts` cung cấp cơ chế resolve tổng quát. `src/adapter/playwright/loader.ts` là instance dùng config mặc định (target `>= 1.27.1`, fallback packages `['playwright-core']`).

## Giới hạn và điều kiện

- Yêu cầu Playwright Core >= 1.27.1 (peer dependency).
- Chỉ hoạt động với CJS packages (dùng `createRequire`).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/playwright-module-loader.spec.md`
- Design: `docs/designs/playwright-module-loader.design.md`
- Source: `src/loader/index.ts`, `src/adapter/playwright/loader.ts`
```

- [ ] **Step 4.7: Viết lại type-system.product.md** (hiện 48 dòng)

```markdown
# Product: Hệ thống kiểu (Type System)

## Mô tả

Hệ thống 5 file TypeScript types cung cấp interface và option types cho toàn bộ thư viện. `PWChromium` là interface chính, các `FingerprintOptions`, `ProxyOptions`, `ProfileOptions`, `FetchOptions` là option types cho từng tính năng.

## Cách sử dụng

```ts
import {
  Chromium,
  type PWChromium,
  type FingerprintOptions,
  type ProxyOptions,
  type ProfileOptions,
  type FetchOptions,
} from 'fingerprint-chromium-engine';

// Dùng FingerprintOptions với satisfies
Chromium.useFingerprint(data, {
  usePerfectCanvas: true,
  safeWebGL: true,
} satisfies FingerprintOptions);

// Dùng ProxyOptions
Chromium.useProxy('http://user:pass@host:8080', {
  changeTimezone: true,
  changeWebRTC: 'replace',
} satisfies ProxyOptions);
```

## Hành vi chi tiết

- `PWChromium` là **interface** — không thể `new PWChromium()`. Dùng singleton `Chromium`.
- `Chromium.newFingerprint()` nhận `FetchOptions`, trả về `Promise<string | undefined>`.
- `IPString = string & {}` là branded type — đảm bảo giá trị truyền vào là string nhưng TypeScript vẫn nhận dạng được là IP string.
- Các field có `@default` trong JSDoc — nếu không truyền, engine dùng giá trị mặc định.
- 5 file types được export public từ `src/index.ts`. Internal types không được re-export.

## Giới hạn và điều kiện

- Chỉ 5 file type được export public: `PWChromium`, `FingerprintOptions`, `ProxyOptions`, `ProfileOptions`, `FetchOptions`.
- `ProxyOptions.dnsMode` chỉ có hiệu lực khi proxy đã được cấu hình.
- `FingerprintOptions.safeElementSize` mặc định `false`.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/type-system.spec.md`
- Design: `docs/designs/type-system.design.md`
- Source: `src/types/*.ts`
```

---

### Task 5: Cross-reference và kiểm tra cuối cùng

- [ ] **Step 5.1: Đọc lại 20 file product docs đã viết, kiểm tra consistency:**
  - Luồng launch và cleanup có nhất quán giữa các docs không?
  - Tên method, tham số có đúng với code không?
  - `usePrivateKey` có còn sót không? (phải không còn)
  - Import trong ví dụ code có đúng không?

- [ ] **Step 5.2: Chạy kiểm tra:**
  ```bash
  rg -n "usePrivateKey" docs/products/
  # Kết quả mong đợi: không có dòng nào
  ```
  ```bash
  rg -n "TBD|TODO|\\.\\.\\.|<tên" docs/products/
  # Kết quả mong đợi: không có dòng nào
  ```

- [ ] **Step 5.3: Cập nhật ROADMAP.md** — đánh dấu task product-docs-rewrite hoàn thành (nếu có)
