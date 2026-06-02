# Design: BrowserEngine

## Vấn đề

User cần một class đơn giản, fluent API để điều khiển toàn bộ lifecycle: cấu hình fingerprint, proxy, profile → launch → tạo context → quit.

## Giải pháp: BrowserEngine class (singleton)

Class `BrowserEngine` implement `PWChromium` interface, sử dụng singleton pattern:

```ts
const Chromium: PWChromium = new BrowserEngine();
export { Chromium };
```

### Luồng hoạt động

1. **Khởi tạo**: Constructor tạo `PlaywrightFingerprintPlugin` + `AdapterDataManager`. Đọc config từ env: `BABLOSOFT_KEY`, `BROWSER_RUNNING_DIR`, `ENGINE_WORKING_DIR`.

2. **Cấu hình (Fluent)**:
   - `useFingerprint(data, options)`: Lưu `[data, options]` vào `this.fingerprints`
   - `useProxy(data, options)`: Lưu `[data, options]` vào `this.proxyData`
   - `useProfile(dirPath, options)`: Gọi `dataManager.map(dirPath)` để copy profile vào temp, lưu `[tempPath, options]` vào `this.profileData`
   - `repackChromium(launcher)`: Tạo `PlaywrightFingerprintPlugin` mới với custom launcher

3. **launch()**:
   - Chỉ cho phép gọi 1 lần (kiểm tra `isLaunched`)
   - Merge options: defaults < pre-configured < launch-time
   - Cấu hình engine: `setServiceKey`, `setWorkingFolder`, `useProfile`
   - Áp dụng proxy + fingerprint nếu có

4. **newContext()**:
   - Chỉ gọi được sau `launch()`
   - Mỗi lần launch chỉ được tạo 1 context (phải quit() trước nếu muốn context mới)
   - Gọi `this.engine.launchPersistentContext(profilePath, mergedOptions)`

5. **quit()**:
   - Close context
   - Map temp profile về thư mục gốc: `dataManager.map(tempDir, saveProfileDirPath)`
   - Xoá temp profile: `dataManager.unmap(BROWSER_RUNNING_DIR)`

### Profile safety

Cơ chế temp dir: khi `useProfile(dirPath)` được gọi, `AdapterDataManager.map(source)` copy profile vào thư mục tạm `<BROWSER_RUNNING_DIR>/profile/<timestamp>_<random4hex>`. Browser chạy trên temp dir. Khi `quit()`, copy ngược lại thư mục gốc. Tránh corrupt profile nếu browser crash.

---

Xem thêm: [Spec](../specs/browser-engine.spec.md) | [Plan](../plans/browser-engine.plan.md)
