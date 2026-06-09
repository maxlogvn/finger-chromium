# Kiến trúc engine BAS -- Tài liệu phân tích toàn diện

## 1. Tổng quan

Hệ thống gồm ba tiến trình chính giao tiếp với nhau qua file-based IPC:

```
+------------------+         File-based IPC        +-------------------------+        spawn          +-------------------+
|  Node.js Plugin  | <----------------------------> | FastExecuteScript.exe   | ------------------->  | worker.exe        |
|  (TypeScript)    |    (request/response JSON)     | (BAS Engine - C++)       |    child_process     | (Chromium-based)  |
+------------------+                               +-------------------------+                       +-------------------+
        |                                                    |                                             ^
        |                                                    | TCP                                         |
        |  +-----------------------------------+             | connection                                  | CDP (DevTools)
        |  | PCAP Mock Server (127.0.0.1)      | <-----------+                                             |
        |  | (net.createServer)                |                                                           |
        |  +-----------------------------------+                                             +---------------------------+
        |                                                                                    | Browser CDP Client        |
        +----------------------------------------------------------------------------------->| (chrome-remote-interface) |
                                                                                            +---------------------------+
```

### Ba tiến trình chính

| Tiến trình | Vai trò | Ngôn ngữ |
|------------|---------|----------|
| **Node.js Plugin** (`src/plugin/`) | Quản lý vòng đời, gửi request config tới engine, spawn worker, điều khiển viewport qua CDP | TypeScript |
| **FastExecuteScript.exe** | Trình thông dịch script XML của BAS, xử lý fingerprint/proxy/profile, quản lý file cấu hình | C++ (close-source) |
| **worker.exe** | Chromium đã được patch để nhúng engine BAS, chấp nhận các flag đặc biệt, inject fingerprint ở tầng C++ | C++ (close-source) |

---

## 2. Giao diện ngoài của FastExecuteScript.exe

### 2.1 Command-line Arguments

Engine được khởi chạy từ `src/plugin/connector/engine.ts` (dòng 264-276) với các tham số:

| Argument | Nguồn | Mô tả |
|----------|-------|-------|
| `--silent` | Hard-coded | Luôn được truyền, chế độ im lặng |
| `--mock-pcap-port=<port>` | Thêm bởi Connector (`connector/index.ts` dòng 100) | Port của PCAP mock server |
| `...this.#args` | Tuỳ chỉnh từ người dùng | Các args bổ sung qua `options` |

Engine **không sử dụng stdin/stdout** để giao tiếp. Stdio được spawn với pipe mặc định nhưng Node.js không đọc dữ liệu từ đó.

### 2.2 Các file Engine đọc/ghi

Khi engine khởi động, Node.js chuẩn bị các file cấu hình trong thư mục `script/<version>/`:

| File | Nội dung | Mục đích |
|------|----------|----------|
| `worker_command_line.txt` | `--mock-connector` | Tham số dòng lệnh cho worker.exe mà engine sẽ spawn |
| `settings.ini` | `RunProfileRemoverImmediately=true` | Yêu cầu engine xoá profile ngay lập tức khi đóng |
| `project.xml` | Copy từ package root | Dự án BAS chứa script XML định nghĩa các function `api_setup`, `api_fetch`, `api_versions` |

Engine **đọc** file `project.xml` để lấy script XML.
Engine **đọc và ghi** các file trong thư mục `r/` (request directory).
Engine **ghi** các file cấu hình `.ini` trong thư mục `s/`.

---

## 3. Cơ chế IPC: File-based Request/Response

### 3.1 Thư mục và cấu trúc file

Hệ thống sử dụng **file-based IPC** thông qua thư mục `r/` (requests):

- **Thư mục request**: `<scriptDir>/r/` -- nơi Node.js tạo các file request JSON.
- **Định dạng tên file**: `<pid>_<uuid>.json` (ví dụ: `12345_abc-def-123.json`).
- PID là PID của tiến trình FastExecuteScript.exe.

### 3.2 Cách Node.js gửi request

Trong `src/plugin/connector/engine.ts`, method `runFunction()` (dòng 133-213):

1. **Tạo thư mục** `r/` nếu chưa tồn tại.
2. **Dọn dẹp file request cũ** của các tiến trình đã chết (dòng 145-157): duyệt tất cả file trong `r/`, trích xuất PID từ tên file. Nếu PID không còn tồn tại (`process.kill(pid, 0)` thất bại với `ESRCH`), xoá file đó.
3. **Tạo file request mới**: `<pid>_<randomUUID()>.json` (dòng 158).
4. **Ghi nội dung JSON** vào file (dòng 160-166):
   ```json
   {
     "name": "<function_name>",
     "params": { ... }
   }
   ```
5. **Theo dõi file bằng chokidar** (dòng 167-169): sử dụng `chokidar.watch()` với `awaitWriteFinish: true` để lắng nghe sự kiện `change`.
6. **Đợi phản hồi** (dòng 172-198):
   - Khi file thay đổi, Node.js đọc lại file để lấy JSON response.
   - Sau khi nhận response, xoá file request.
   - Có **requestTimeout** (mặc định 900s) -- nếu quá thời gian, reject promise với `RequestTimeoutError`.
   - Có **closeTimeout** (60s) -- nếu engine process đóng khi đang chờ, resolve với empty string.

### 3.3 Cách Engine xử lý request

Engine chạy script XML trong `project.xml`. Script này có một vòng lặp chính (dòng 738-861):

1. **Tìm file request**: Tìm trong thư mục `r/` các file có pattern `<pid>_*.json` (dòng 746-747).
2. **Đọc file request**: Đọc nội dung JSON từ file (dòng 786-787).
3. **Parse request**: Parse JSON để lấy `name` và `params` (dòng 791-795).
4. **Route đến function**: Kiểm tra `request.name`:
   - `"versions"` -> gọi `api_versions()`
   - `"fetch"` -> gọi `api_fetch()`
   - `"setup"` -> gọi `api_setup()`
   - Khác -> trả về error `"Function with selected name not exist."`
5. **Ghi response**: Ghi JSON response trở lại **cùng file đó** (dòng 857: `native("filesystem", "writefile", ...)`).
6. **Lặp lại**: Tiếp tục tìm request tiếp theo.

### 3.4 Các loại request/response

#### a. `setup` -- Thiết lập môi trường browser

**Request params**:
```typescript
{
  name: "setup",
  params: {
    fingerprint: { value: string, options: FingerprintOptions },
    profile: { value: string, options: ProfileOptions },
    proxy: { value: string, options: ProxyOptions },
    version: string,
    pid: string,         // UUID làm process ID
    key: string          // service key
  }
}
```

**Response** (được tạo trong `api_setup` function):
```typescript
{
  id: string,            // browser unique ID
  pid: string,           // process ID
  pwd: string,           // working directory path (browser.<id>)
  path: string,          // path to worker/chrome executable
  bounds: {              // viewport bounds
    width?: number,
    height?: number,
    diff?: { width: number, height: number },
    availWidth?: number,
    availHeight?: number
  },
  extensions: string[],  // danh sách extensions
  profile: string,       // đường dẫn profile
  error: string | null
}
```

Engine thực hiện trong `api_setup`:
- Thiết lập cấu hình browser (QUIC, tunneling, Widevine, WebGL, Canvas, Audio, WebRTC...)
- Thay đổi profile (nếu có), copy các file cấu hình
- Áp dụng fingerprint (nếu có) qua `BrowserAutomationStudio_ApplyFingerprint`
- Cấu hình proxy qua `set_proxy()` và `set_proxy_extended()`
- Copy các file quan trọng vào thư mục làm việc `browser.<id>/`:
  - `browser.<id>/worker/chrome` (từ `Worker.<id>/chrome`)
  - `browser.<id>/t/<pid>` (từ `t/<browser_process_id>`)
  - `browser.<id>/s/<id>.ini` và `browser.<id>/s/<id>1.ini` (từ `s/<id>.ini` và `s/<id>1.ini`)

#### b. `fetch` -- Lấy fingerprint từ dịch vụ

**Request params**:
```typescript
{
  name: "fetch",
  params: {
    key: string,
    options: FetchOptions,
    version: string
  }
}
```

**Response**:
```typescript
{
  response: string,  // fingerprint JSON
  error: string | null
}
```

Engine gọi `BrowserAutomationStudio_GetFingerprint()` để lấy fingerprint từ server.

#### c. `versions` -- Lấy danh sách phiên bản browser

**Request params**:
```typescript
{
  name: "versions",
  params: {
    format: "default" | "extended"
  }
}
```

**Response**:
```typescript
{
  response: string[],  // danh sách phiên bản
  error: string | null
}
```

---

## 4. PCAP Mock Server

### 4.1 Mục đích

PCAP (Packet Capture) Server là một mock server TCP mà Node.js tạo ra để giả lập các yêu cầu PCAP từ BAS Engine. Engine có thể cần kết nối đến một PCAP server để thu thập hoặc kiểm tra thông tin mạng.

### 4.2 Giao thức

Server lắng nghe trên `127.0.0.1` với port ngẫu nhiên (port 0). Giao thức rất đơn giản, là binary protocol:

- **Byte 0x01** (command type 1): Engine gửi byte `0x01`, server phản hồi 9 bytes:
  ```
  [0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id_lo, id_mid, id_hi]
  ```
  Trong đó `id` là counter tăng dần từ 0.

- **Byte 0x07** (command type 7): Engine gửi byte `0x07`, server phản hồi 5 bytes:
  ```
  [0x07, 0x00, 0x00, 0x00, 0x00]
  ```

Server chỉ xử lý byte đầu tiên của mỗi gói tin. Các gói tin trống được bỏ qua.

### 4.3 Port được truyền cho Engine

Port của PCAP server được truyền vào engine qua command-line arg `--mock-pcap-port=<port>` (`src/plugin/connector/index.ts` dòng 100). Điều này cho phép engine kết nối đến mock server thay vì PCAP server thật.

---

## 5. Quá trình khởi động browser với fingerprint (step-by-step)

### Bước 1: Cấu hình plugin

Người dùng gọi các method trên `FingerprintPlugin`:
```javascript
plugin.useFingerprint("key", { ...options });
plugin.useProxy("proxy_string", { ...options });
plugin.useProfile("profile_path", { ...options });
plugin.setServiceKey("service_key");
```

### Bước 2: Gọi `spawn()`

`plugin.spawn(options)` -> `_launch(true, options)` (`src/plugin/index.ts` dòng 174-185).

### Bước 3: Gọi API `setup` qua engine

**3a.** Node.js đảm bảo PCAP server đang chạy (`connector/index.ts` dòng 98-99).

**3b.** Node.js set engine args: `--mock-pcap-port=<port>` (dòng 100).

**3c.** Node.js gọi `connector.api('setup', params)` (dòng 187-200).

**3d.** Connector sử dụng `async-lock` để đảm bảo chỉ một request tại một thời điểm (dòng 106).

**3e.** Connector gọi `engine.runFunction('setup', params)`.

**3f.** Engine xử lý request (nếu chưa chạy, nó được download, extract, và khởi động trước):

- **Download** (nếu cần): Tải `FastExecuteScript.x64.zip` (hoặc `x32`) từ GitHub Releases:
  `https://github.com/maxlogvn/finger-chromium/releases/download/engine-v<version>/FastExecuteScript.x64.zip`

  Version được đọc từ `project.xml` (`<EngineVersion>29.9.2</EngineVersion>`).

- **Extract**: Giải nén ZIP vào `data/script/<version>/`.

- **Copy files**:
  - `project.xml` -> `script/<version>/project.xml`
  - Tạo `worker_command_line.txt` với nội dung `--mock-connector`
  - Tạo `settings.ini` với nội dung `RunProfileRemoverImmediately=true`

- **Start process**: Chạy `FastExecuteScript.exe --silent --mock-pcap-port=<port>` với cwd là `script/<version>/`.

**3g.** Engine đọc `project.xml`, chạy script, tìm request file, xử lý `api_setup`.

**3h.** Trong `api_setup`, engine:
- Cấu hình browser settings (Widevine, SafeBrowsing, QUIC, Canvas, Audio, WebGL, WebRTC...)
- Nếu có fingerprint -> gọi `BrowserAutomationStudio_ApplyFingerprint()` để áp dụng fingerprint
- Nếu có proxy -> gọi `set_proxy()` và `set_proxy_extended()`
- Nếu có profile -> copy profile và gọi `BrowserAutomationStudio_ChangeProfile()`
- Tính toán bounds (viewPort) từ fingerprint nếu có
- Tạo các file cấu hình trong `browser.<id>/`:
  - `browser.<id>/worker/chrome` -- Chromium executable
  - `browser.<id>/t/<pid>` -- process tracking file
  - `browser.<id>/s/<id>.ini` -- settings file
  - `browser.<id>/s/<id>1.ini` -- settings file (được Node.js config manager sửa đổi)

**3i.** Engine trả về response JSON chứa `id`, `pid`, `pwd`, `path`, `bounds`.

### Bước 4: Chuẩn bị launch

Node.js nhận response và:

**4a.** Lưu `processId = pid` (dòng 209).

**4b.** Tạo mutex: `mutex.create('BASProcess' + pid)` -- một named mutex native (Windows) để đồng bộ hoá (dòng 212).

**4c.** Khởi động `SettingsCleaner.watch(pwd)` -- theo dõi thư mục làm việc và dọn dẹp các file settings cũ mỗi 15s (dòng 210).

**4d.** Lock các file của process hiện tại: `cleaner.ignore(pwd, pid, id)` -- lock file `t/<pid>`, `s/<id>.ini`, `s/<id>1.ini` bằng `proper-lockfile` (dòng 211).

### Bước 5: Launch browser (worker.exe)

**5a.** Xây dựng launch options (dòng 217-227):
```typescript
{
  executablePath: "<pwd>/worker.exe",       // Chromium-based browser
  args: [
    '--parent-process-id=<pid>',
    '--unique-process-id=<id>',
    '--user-data-dir=<profile>',
    '--lang=en',
    '--no-proxy-server',
    '--disable-auto-reload',
    '--bas-disable-tab-hook',
    '--disk-cache-size=5000000',
    '--disable-features=NetworkServiceInProcess2,OptimizationGuideModelDownloading,AutoDeElevate',
    // + các args từ người dùng (đã lọc bỏ --kiosk, --headless, --user-data-dir, --start-maximized, --start-fullscreen)
    // + '--bas-force-visible-window' (nếu không headless)
    // + '--hide-scrollbars', '--mute-audio' (nếu headless)
  ],
  headless: false
}
```

**5b.** Launcher (`src/plugin/launcher/index.ts`) spawn `worker.exe`:
```typescript
spawn(executablePath, args, {
  detached: false,
  shell: false,
  stdio: ['ignore', 'pipe', 'pipe']
})
```

**5c.** Launcher đợi DevTools URL từ stdout/stderr của worker.exe (dòng 76-82):
- Lắng nghe dòng output có chứa `DevTools listening on ws://...` hoặc `wss://...`
- Trích xuất URL và port từ đó.
- Timeout mặc định là 30s.

**5d.** Trả về Browser object với:
- `process`: ChildProcess
- `port`: debug port
- `url`: DevTools WebSocket URL
- `close()`: Dừng browser bằng `taskkill /pid <pid> /T /F` (diệt toàn bộ process tree)

### Bước 6: Cấu hình viewport qua CDP

**6a.** `ConfigManager.configure()` (`src/plugin/config.ts` dòng 50-58):
- Đăng ký cleanup handler khi process thoát.
- Gọi `browser.configure()` để set viewport.

**6b.** `ConfigManager.synchronize()` (`config.ts` dòng 60-79):
- Đọc file `<pwd>/s/<id>1.ini`.
- Thực hiện **hai lần ghi** vào file `.ini`:
  - **Lần 1** (reset): Ghi `availWidth=BAS_NOT_SET`, `availHeight=BAS_NOT_SET` -- engine phát hiện thay đổi và reset viewport.
  - Đợi `pollInterval` ms (mặc định 500ms).
  - **Lần 2**: Ghi `availWidth=<actual_width>`, `availHeight=<actual_height>` -- engine áp dụng viewport mới.
- Engine theo dõi file `.ini` này và tự động điều chỉnh kích thước cửa sổ browser.

**6c.** CDP setViewport (`src/plugin/browser.ts` dòng 52-104):
- Kết nối đến browser qua CDP (`chrome-remote-interface`).
- Lấy `windowId` qua `Browser.getWindowForTarget()`.
- Tính toán bounds (`width + diff.width`, `height + diff.height`). Diff mặc định là (16, 88) hoặc (16, 94) cho Chrome >= 115.
- Gọi `Browser.setWindowBounds()` kết hợp với `waitForResize()` (script JS inject để đợi ResizeObserver).
- Verify viewport qua `getViewport()` -- lấy `window.innerWidth/innerHeight` qua CDP `Runtime.evaluate()`.
- Retry tối đa 3 lần, điều chỉnh delta nếu sai lệch.

### Bước 7: Browser sẵn sàng

Browser đã được cấu hình đầy đủ (fingerprint, proxy, profile, viewport) và sẵn sàng sử dụng. Người dùng có thể sử dụng CDP URL để kết nối và điều khiển browser.

### Bước 8: Cleanup

Khi gọi `plugin.cleanup()`:
- Đóng browser (`browser.close()` -> `taskkill /pid /T /F`).
- Dừng engine (`connector.cleanup()` -> `engine.kill()` -> SIGTERM + SIGKILL sau 5s).
- Release mutex (`mutex.release('BASProcess' + pid)`).
- Dừng SettingsCleaner (unlock tất cả file, xoá các file settings cũ).

---

## 6. Cách engine tiêm fingerprint vào Chromium

Engine sử dụng các cơ chế nội tại của **BrowserAutomationStudio (BAS)** để tiêm fingerprint. Cụ thể trong `project.xml`:

### 6.1 Fingerprint application (`api_setup` function)

Khi có fingerprint, engine gọi:
```
BrowserAutomationStudio_ApplyFingerprint(
  fingerprint_json,
  safeCanvas,        // "true"/"false" -- bảo vệ canvas fingerprinting, thêm noise
  safeWebGL,         // "true"/"false" -- bảo vệ WebGL fingerprinting
  safeAudio,         // "true"/"false" -- bảo vệ AudioContext fingerprinting
  safeBattery,       // "true"/"false" -- giả lập Battery API
  safeElementSize,   // "true"/"false" -- bảo vệ kích thước element
  usePerfectCanvas,  // "true"/"false" -- Perfect Canvas request để có fingerprint canvas hoàn hảo
  emulateSensorAPI,  // "true"/"false" -- giả lập sensor API (accelerometer, gyroscope...)
  useFontPack,       // "true"/"false" -- sử dụng bộ font được cấu hình sẵn
  emulateDeviceScaleFactor, // "true"/"false" -- giả lập device pixel ratio
  serviceKey
)
```

Các flag này kiểm soát việc giả lập API của trình duyệt để khớp với fingerprint gốc.

### 6.2 Proxy injection

Engine gọi `set_proxy()` và `set_proxy_extended()` của BAS để cấu hình proxy ở cấp độ trình duyệt. Các tham số bao gồm:
- DNS mode (`system-proxy`, `custom-proxy`, `custom-direct`)
- IP extraction method (`raw`, custom URL)
- Public/Private IPv4/IPv6 configuration
- WebRTC IP handling
- Geolocation/timezone/browser language changes

### 6.3 Browser settings (qua `_settings()`)

Engine áp dụng cấu hình browser settings bao gồm:
- QUIC (enable/disable)
- Tunneling (enable/disable)
- Widevine (enable)
- SafeBrowsing (enable)
- Components (enable)
- MaxFPS (30)
- Canvas/WebGL/Audio noise settings
- Browser version selection

### 6.4 Các giá trị mặc định (từ `project.xml`)

```javascript
"setup.fingerprint": {
    emulateDeviceScaleFactor: true,
    emulateSensorAPI: true,
    usePerfectCanvas: true,
    safeElementSize: false,
    useFontPack: true,
    safeBattery: true,
    safeCanvas: true,
    safeAudio: true,
    safeWebGL: true,
},
"setup.proxy": {
    enableQUIC: false,
    enableTunneling: true,
    changeBrowserLanguage: true,
    changeGeolocation: false,
    changeTimezone: true,
    changeWebRTC: true,
    publicIPv4: "auto",
    publicIPv6: "auto",
    privateIPv4: "local",
    privateIPv6: "local",
    ipExtractionMethod: { v4: "raw", v6: "raw" },
    detectExternalIP: { v4: true, v6: true },
    dnsMode: "System DNS. Through proxy",
}
```

---

## 7. Các kênh giao tiếp

### 7.1 Request/Response Files (IPC chính)

| Thư mục/File | Người ghi | Người đọc | Mục đích |
|---|---|---|---|
| `<scriptDir>/r/<pid>_<uuid>.json` | Node.js (request), Engine (response) | Engine (request), Node.js (response) | Kênh IPC chính |

### 7.2 Configuration Files

| File | Người ghi | Người đọc | Mục đích |
|---|---|---|---|
| `<scriptDir>/worker_command_line.txt` | Node.js | Engine | Tham số dòng lệnh cho worker.exe |
| `<scriptDir>/settings.ini` | Node.js | Engine | Cấu hình engine (`RunProfileRemoverImmediately`) |
| `<pwd>/s/<id>.ini` | Engine | Cleaner | Settings file chính cho browser instance |
| `<pwd>/s/<id>1.ini` | Engine, Node.js (ConfigManager) | Engine, Node.js | Settings file phụ -- Node.js ghi `availWidth`/`availHeight` để điều khiển viewport |
| `<pwd>/t/<pid>` | Engine | Cleaner | Process tracking file |

### 7.3 Lock Files (`proper-lockfile`)

| File | Mục đích |
|---|---|
| `<pwd>/t/<pid>.lock` | Lock process tracking file |
| `<pwd>/s/<id>.ini.lock` | Lock settings file |
| `<pwd>/s/<id>1.ini.lock` | Lock settings file phụ |

### 7.4 Mutex (Native Windows)

- `BASProcess<pid>` -- Named mutex được tạo qua native Node module (`mutex.node`) để đồng bộ hoá giữa các Node.js process sử dụng cùng engine. Chỉ hỗ trợ Windows (`win32-x64`, `win32-ia32`).

### 7.5 PCAP Mock Server

- **TCP Server** trên `127.0.0.1:<random_port>`
- **Protocol**: Binary đơn giản (byte 0x01 -> 9-byte response, byte 0x07 -> 5-byte response)
- **Port được truyền** qua `--mock-pcap-port=<port>` arg cho engine

---

## 8. Tổng kết các bước chính

```
1. Node.js plugin nhận cấu hình (fingerprint, proxy, profile)
2. plugin.spawn() được gọi
3. PCAP mock server được khởi tạo (nếu chưa có)
4. connector.api('setup', params):
   a. Engine được download/extract/start (nếu chưa có)
   b. Node.js ghi request JSON vào r/<pid>_<uuid>.json
   c. Engine đọc request, xử lý (cấu hình browser, apply fingerprint, set proxy)
   d. Engine ghi response JSON vào cùng file
   e. Node.js đọc response qua chokidar watch
5. Node.js lấy thông tin từ response (path đến worker.exe, profile, bounds...)
6. Node.js spawn worker.exe với các args phù hợp
7. worker.exe in DevTools URL ra stdout
8. Node.js đọc URL, lấy debug port
9. Node.js kết nối CDP, set viewport chính xác
10. Node.js đồng bộ viewport vào s/<id>1.ini để engine theo dõi
11. Browser sẵn sàng sử dụng
12. Cleanup: taskkill worker.exe, kill engine, release mutex, unlock/dọn dẹp settings files
```

---

## 9. Các điểm đặc biệt

1. **Engine là BAS script engine**: `FastExecuteScript.exe` là một trình thông dịch script XML của BrowserAutomationStudio. `project.xml` chứa script XML định nghĩa các function mà engine có thể thực thi. Script này sử dụng JPath để parse JSON, `native()` để gọi native functions, và có cấu trúc vòng lặp chính để xử lý các request liên tục.

2. **Viewport synchronization**: Cơ chế đồng bộ viewport giữa Node.js và engine rất đặc biệt. Node.js ghi `availWidth`/`availHeight` vào file `s/<id>1.ini`. Engine theo dõi file này và tự động điều chỉnh kích thước cửa sổ. Node.js thực hiện 2 lần ghi (reset -> set) để báo hiệu cho engine.

3. **Graceful download**: Downloader có cơ chế "grace timeout" 30s -- nếu GitHub CDN không gửi tín hiệu kết thúc stream đúng cách, downloader sẽ force-close stream sau khi nhận đủ số bytes + 30s.

4. **Proper-lockfile**: Sử dụng file lock để bảo vệ các file cấu hình khỏi bị xoá khi đang được sử dụng bởi một process khác. Cleaner định kỳ (15s) quét và xoá các file không bị lock của các process đã chết.

5. **Mutex**: Sử dụng named mutex native (Windows-only) để đồng bộ hoá giữa các Node.js process -- đảm bảo không có hai process cùng sử dụng một BAS process ID. File native module nằm ở `plugin/mutex/win32-x64/mutex.node` và `plugin/mutex/win32-ia32/mutex.node`.

6. **Engine version**: Được đọc từ `<EngineVersion>29.9.2</EngineVersion>` trong `project.xml`. URL download được xây dựng động: `https://github.com/maxlogvn/finger-chromium/releases/download/engine-v<version>/FastExecuteScript.x<ARCH>.zip`.

7. **ChromeCommandLine mặc định** (từ `project.xml`):
   ```
   --disk-cache-size=5000000
   --disable-features=OptimizationGuideModelDownloading,AutoDeElevate
   --lang=en
   --disable-auto-reload
   ```
