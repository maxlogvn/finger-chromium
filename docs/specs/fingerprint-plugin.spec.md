# Spec: FingerprintPlugin

## Mô tả

Plugin core điều phối engine: config methods + API calls + spawn lifecycle.

## API

### Config methods

| Method | Mô tả |
|---|---|
| `useFingerprint(value, options)` | Gắn fingerprint |
| `useProxy(value, options)` | Định tuyến proxy |
| `useProfile(value, options)` | Liên kết profile |
| `useBrowserVersion(version)` | Chọn version |
| `setServiceKey(key)` | Gán private key |
| `setWorkingFolder(folder)` | Thư mục làm việc |
| `setRequestTimeout(timeout)` | Timeout request |
| `setEngineTimeout(timeout)` | Timeout engine |

### API methods

| Method | Mô tả |
|---|---|
| `fetch(options)` | Lấy fingerprint |
| `versions(format)` | Danh sách version |

### Lifecycle

1. `spawn()` → `_launch(true, options)`
2. API `setup` → cleaner watch → mutex create
3. Spawn worker.exe → configure + synchronize

---

Xem thêm: [Design](../designs/fingerprint-plugin.design.md) | [Plan](../plans/fingerprint-plugin.plan.md)
