# Design: BrowserEngine

## Vấn đề

Cần một class đơn giản, fluent API để người dùng điều khiển toàn bộ vòng đời:
- Cấu hình fingerprint, proxy, profile.
- Launch engine + spawn browser.
- Tạo Playwright BrowserContext.
- Dọn dẹp tài nguyên và lưu profile.

## Giải pháp

### Class `BrowserEngine` implement `PWChromium`

Singleton pattern -- `Chromium` là instance duy nhất được export ra ngoài.

### Luồng hoạt động

```
Constructor
  │
  ├── Tạo PlaywrightFingerprintPlugin
  ├── Tạo AdapterDataManager (quản lý profile)
  └── Đọc env: BABLOSOFT_KEY, BROWSER_RUNNING_DIR, ENGINE_WORKING_DIR
  │
User config:
  ├── useFingerprint(data, options)    → lưu [data, options]
  ├── useProxy(data, options)          → lưu [data, options]
  ├── useProfile(dirPath, options)     → map profile sang temp, lưu [tempPath, options]
  └── repackChromium(launcher)         → tạo plugin mới với custom launcher
  │
launch(options)
  ├── Kiểm tra isLaunched (chỉ 1 lần)
  ├── Merge options: DEFAULT < pre-configured < launch-time
  ├── engine.setServiceKey(key)
  ├── engine.setWorkingFolder(dir)
  ├── engine.useProfile(...)
  ├── engine.useProxy(...) nếu có
  └── engine.useFingerprint(...) nếu có
  │
newContext(options)
  ├── Kiểm tra isLaunched + context chưa tồn tại
  ├── Merge options
  └── engine.launchPersistentContext(profilePath, options) → BrowserContext
  │
quit(saveDataPath?)
  ├── Close context
  ├── Copy temp profile về thư mục gốc (dataManager.map)
  └── Unmap + reset trạng thái
```

### Profile Safety

Khi `useProfile(dirPath)` được gọi, `AdapterDataManager.map(dirPath)` copy profile vào thư mục tạm `<BROWSER_RUNNING_DIR>/profile/<timestamp>_<random>/`. Browser chạy trên bản copy. Khi `quit()`, copy ngược lại thư mục gốc. Tránh corrupt profile nếu browser crash.

### Lifecycle Enforcement

- `launch()` chỉ gọi được 1 lần (kiểm tra `isLaunched`).
- `newContext()` chỉ gọi được sau `launch()` và chỉ 1 context mỗi lần.
- `quit()` an toàn gọi nhiều lần (guard bằng `isLaunched`).

---

Xem thêm: [Spec](../specs/browser-engine.spec.md) | [Plan](../plans/browser-engine.plan.md)
