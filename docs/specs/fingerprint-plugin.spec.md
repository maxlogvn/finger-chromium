# Spec: FingerprintPlugin

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`FingerprintPlugin` là core orchestrator — lớp trung tâm điều phối toàn bộ vòng đời fingerprint engine. Nó nhận cấu hình từ user (fingerprint, proxy, profile, version), gọi API service (fetch, versions), spawn worker.exe, cấu hình viewpost và file `.ini`, và dọn dẹp tài nguyên khi kết thúc.

Đây là lớp thấp nhất trong public API chain. `PlaywrightFingerprintPlugin` kế thừa từ nó. `BrowserEngine` gọi nó gián tiếp qua bridge.

Source: `src/plugin/index.ts` (302 dòng).

## Yêu cầu

- Fluent API cho config: `useFingerprint()`, `useProxy()`, `useProfile()`, `useBrowserVersion()` — tất cả trả về `this`.
- API service: `fetch()` lấy fingerprint, `versions()` lấy danh sách version.
- Lifecycle: `spawn()` → `_launch()` → `configure()` → `cleanup()`.
- `setProxyFromArguments()` — fallback lấy proxy từ args nếu `useProxy()` chưa gọi.
- `setWorkingFolder()`, `setRequestTimeout()`, `setEngineTimeout()` — cấu hình engine.
- `setServiceKey()` — set key module-level (dùng chung cho mọi instance).
- `static create(launcher)` — factory method validate launcher trước khi khởi tạo.
- Export class `FingerprintPlugin` — Playwright bridge kế thừa từ class này.
- `cleanup()` phải dọn: browser, connector (engine + PCAP), mutex, cleaner.

## Thiết kế

### Kiến trúc

```
FingerprintPlugin
  ├── Config fields: fingerprint, proxy, profile, version
  ├── Runtime: browser, processId
  ├── Engine: connector → api() → RemoteEngine
  ├── Cleaner: SettingsCleaner (file tạm engine)
  └── Mutex: Windows named mutex
```

`serviceKey` là biến **module-level** (không phải instance field). Lý do: engine binary chỉ cần một key cho toàn bộ process. Nếu là instance field, mỗi plugin instance phải set key riêng — dễ quên.

Tham chiếu design doc: `docs/designs/fingerprint-plugin.design.md`.

### Luồng _launch() (6 bước)

```
_launch(useDefaultLauncher, options)
 │
 ├─ Bước 1: setProxyFromArguments(args)
 │   Nếu user chưa gọi useProxy(), tìm --proxy-server trong args và dùng làm proxy.
 │
 ├─ Bước 2: api('setup', params)
 │   Gửi lên engine: proxy, fingerprint, version, profile, pid (UUID), key.
 │   Nhận về: { id, pid, pwd, path, bounds, ...config }
 │
 ├─ Bước 3: cleaner.watch(pwd).ignore(pwd, pid, id) + mutex.create()
 │   Đăng ký file cleanup cho thư mục engine + tạo Windows mutex.
 │
 ├─ Bước 4: Chọn launcher
 │   useDefaultLauncher=true  → launcher mặc định (spawn worker.exe)
 │   useDefaultLauncher=false → options.launcher ?? this.launcher (custom, từ bridge)
 │
 ├─ Bước 5: Spawn worker.exe
 │   - headless: false (fingerprint check phát hiện headless)
 │   - userDataDir: undefined (engine tự quản lý)
 │   - defaultViewport: undefined (engine tự resize)
 │   - executablePath: browserPath/worker.exe
 │   - args: --parent-process-id, --unique-process-id, defaultArgs()
 │
 └─ Bước 6: configure() + synchronize()
     - configure(): onClose, bindHooks, resize page đầu tiên
     - synchronize(): đồng bộ bounds vào .ini file
```

## API / Data flow

### Input — Config methods

```ts
plugin.useFingerprint(jsonData, { safeWebGL: true, safeAudio: true });
plugin.useProxy('http://user:pass@host:8080', { changeTimezone: true });
plugin.useProfile('./profiles/user_01', { loadProxy: true, loadFingerprint: true });
plugin.useBrowserVersion('130');
```

Mỗi config method gọi `validateConfig()` để kiểm tra kiểu dữ liệu, lưu vào field dạng `{ value, options }`.

### Input — Engine config methods

```ts
plugin.setServiceKey(process.env.BABLOSOFT_KEY ?? '');
plugin.setWorkingFolder('.tmp/browser/engine');
plugin.setRequestTimeout(300_000);
plugin.setEngineTimeout(300_000);
```

### Input — API methods

```ts
const fp = await plugin.fetch({ tags: ['Microsoft Windows', 'Chrome'] });
const versions = await plugin.versions('extended');
```

### Output

- `fetch()` → `Promise<string>` — JSON string fingerprint.
- `versions()` → `Promise<string[] | Version[]>` — danh sách version.
- `spawn()` → `Promise<Browser>` — browser instance (worker.exe).

### Internal data: SetupResponse

```ts
interface SetupResponse {
  id: string;       // unique process ID (từ engine)
  pid: string;      // parent process ID
  pwd: string;      // working directory
  path: string;     // path to worker.exe
  bounds: { width?: number; height?: number };
  [key: string]: unknown; // additional config từ engine
}
```

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/plugin/index.ts` | `FingerprintPlugin` class — PlaywrightFingerprintPlugin kế thừa | ~300 |
| `src/plugin/utils.ts` | `defaultArgs`, `getProfilePath`, `validateConfig`, `validateLauncher` | — |
| `src/plugin/config.ts` | `configure()` + `synchronize()` — resize + .ini sync | — |
| `src/plugin/launcher/index.ts` | Launcher mặc định — spawn worker.exe | 99 |
| `src/plugin/connector/index.ts` | class `Connector` — mỗi instance có connector riêng | — |
| `src/plugin/cleaner.ts` | `SettingsCleaner` — dọn file tạm engine | — |
| `src/plugin/mutex/index.ts` | Windows named mutex — đồng bộ process | 75 |
| `src/plugin/browser.ts` | `setViewport` + `getViewport` qua CDP (plugin path) | — |

## Constants

| Tên | Vị trí | Giá trị / Ý nghĩa |
|---|---|---|
| `serviceKey` | Module-level | Key từ env `BABLOSOFT_KEY`. Set qua `setServiceKey()`. Undefined nếu chưa set. |

## Environment variables

| Biến | Dùng ở đâu | Mô tả |
|---|---|---|
| `BABLOSOFT_KEY` | `setServiceKey()` → lấy từ env | Key bảo mật cho API engine |
| `FINGERPRINT_CWD` | `connector/index.ts` | Thư mục làm việc engine |
| `FINGERPRINT_TIMEOUT` | `connector/index.ts` | Timeout mặc định (engine + request) |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `validateConfig()` thất bại (data không phải string, options không phải object) | Throw `Error` với message chung |
| `validateLauncher()` thất bại (thiếu method `launch`) | Throw Error |
| `api('setup')` không có key | Connector throw `MissingKeyError` |
| Engine timeout khi setup | Connector throw `EngineTimeoutError` |
| `browser.close()` fail trong `cleanup()` | Catch lỗi, cleanup phần còn lại vẫn chạy |
| `_launch()` gọi nhiều lần | Không có guard ở plugin core — guard ở `BrowserEngine.launch()` |

## Kiểm tra

- Happy path: `useFingerprint()` → `useProxy()` → `spawn()` → browser hoạt động → `cleanup()`.
- Config: `useFingerprint()` trả về `this` (fluent).
- Proxy fallback: `setProxyFromArguments(['--proxy-server=http://host'])` set proxy nếu chưa có.
- API: `fetch()` gọi `api('fetch')` với key, options, version.
- API: `versions('extended')` trả về `Version[]`.
- Runtime: `spawn()` gọi `_launch(true, options)`.
- Cleanup: `cleanup()` gọi `browser.close()`, `connectorCleanup()`, `mutex.release()`, `cleaner.stop()`.
