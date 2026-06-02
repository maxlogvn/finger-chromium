# Design: FingerprintPlugin

## Vấn đề

Cần một lớp trung tâm quản lý toàn bộ vòng đời của fingerprint engine:
- Nhận cấu hình từ user (fingerprint, proxy, profile, version browser).
- Gọi API `setup` để engine binary khởi tạo môi trường.
- Spawn worker.exe (hoặc dùng custom launcher từ Playwright bridge).
- Resize viewport và đồng bộ cấu hình vào file .ini.
- Dọn dẹp tài nguyên sau khi browser đóng.

## Giải pháp

Class `FingerprintPlugin` với 3 lớp method:

### 1. Fluent Configuration

User gọi các method dạng `useXxx()` để đăng ký cấu hình. Mỗi method validate tham số rồi lưu vào property dạng `PluginConfig { value, options }`.

```
useFingerprint(value, options)  → this.fingerprint = { value, options }
useProfile(value, options)      → this.profile = { value, options }
useProxy(value, options)        → this.proxy = { value, options }
useBrowserVersion(version)      → this.version = version || 'default'
```

### 2. API Calls

Hai method gọi API tới engine binary:
- `fetch(options)` → gọi `api('fetch', { key, options, version })`, trả về JSON string fingerprint.
- `versions(format)` → gọi `api('versions', { format })`, trả về `string[]` hoặc `Version[]`.

### 3. Spawn + Lifecycle

`spawn(options)` gọi `_launch(true, options)` -- core lifecycle gồm 6 bước:

1. **setProxyFromArguments()**: Nếu proxy chưa config (this.proxy == null), parse `--proxy-server` từ args.
2. **api('setup')**: Gửi toàn bộ config (fingerprint, proxy, profile, version, pid, key) xuống engine. Engine trả về `{ id, pid, pwd, path, bounds }`.
3. **Cleaner + Mutex**: Đăng ký thư mục pwd với cleaner để tránh bị xoá nhầm; tạo Windows mutex `BASProcess${pid}` cho engine.
4. **Chọn launcher**: Nếu `useDefaultLauncher=true` → dùng plugin's launch (spawn worker.exe). Nếu false → dùng custom launcher (Playwright bridge).
5. **Spawn**: Gọi `launcher.launch()` với `headless: false` (hardcoded), `executablePath` trỏ tới `worker.exe`, args gồm `--parent-process-id` và `--unique-process-id`.
6. **Configure**: Gọi `configure()` từ `config.ts` để resize viewport + đồng bộ availWidth/availHeight vào .ini.

### Module-level serviceKey

`serviceKey` là biến module (không phải class property). Tất cả instance chia sẻ cùng một key. `setServiceKey(key)` ghi đè global key.

### Singleton Plugin

Cuối file export `plugin = new FingerprintPlugin()` -- instance mặc định dùng launcher spawn worker.exe. Playwright bridge tạo instance riêng với custom launcher.

---

Xem thêm: [Spec](../specs/fingerprint-plugin.spec.md) | [Plan](../plans/fingerprint-plugin.plan.md)
