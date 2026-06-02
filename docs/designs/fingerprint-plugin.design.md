# Design: FingerprintPlugin

## Vấn đề

Cần một orchestrator trung tâm quản lý vòng đời: nhận cấu hình từ user -> gọi API `setup` để khởi tạo engine -> spawn worker.exe -> configure viewport -> cleanup.

## Giải pháp

Class `FingerprintPlugin` với lifecycle 4 bước:

### 1. Setup (Fluent config)

User gọi `useFingerprint()`, `useProxy()`, `useProfile()`, `useBrowserVersion()` -- các method này validate và lưu config vào property dạng `PluginConfig`:
```ts
interface PluginConfig {
  value: string;     // JSON string hoặc proxy URL
  options: object;   // FingerprintOptions | ProxyOptions | ProfileOptions
}
```

### 2. _launch() -- Core launch logic

Đây là method quan trọng nhất. Nó có 2 chế độ:
- `useDefaultLauncher = true`: spawn `worker.exe` trực tiếp (dùng plugin launcher)
- `useDefaultLauncher = false`: dùng custom launcher từ Playwright bridge

**Các bước trong _launch():**

1. **Extract proxy từ args**: Nếu proxy chưa config, kiểm tra `--proxy-server` trong args, tự động `setProxyFromArguments()`.
2. **Gọi API setup**: `api('setup', { key, fingerprint, proxy, version, profile, pid })` -- gửi toàn bộ config xuống engine binary. Engine binary trả về `SetupResponse`: `{ id, pid, pwd, path, bounds, ... }`.
3. **Register cleaner + mutex**: `cleaner.watch(pwd).ignore(pwd, pid, id)`, tạo Windows mutex `BASProcess${pid}`.
4. **Spawn browser**: Chọn launcher dựa trên `useDefaultLauncher`. Force `headless: false`, `userDataDir: undefined`, `defaultViewport: undefined`. ExecutablePath trỏ tới `<browserPath>/worker.exe`.
5. **Configure**: Gọi `configure()` (từ `config.ts`) để resize viewport và sync `.ini` file.
6. **Return browser instance**: Hoặc Browser (launcher thường) hoặc BrowserContext (Playwright bridge).

### 3. API calls

- `fetch(options)`: Gọi `api('fetch', { key, options, version })` -- lấy fingerprint từ service
- `versions(format)`: Gọi `api('versions', { format })` -- danh sách browser version

### 4. Cleanup

Khi browser đóng, cleaner gọi `include()` để unlock file, mutex được giải phóng.

---

Xem thêm: [Spec](../specs/fingerprint-plugin.spec.md) | [Plan](../plans/fingerprint-plugin.plan.md)
