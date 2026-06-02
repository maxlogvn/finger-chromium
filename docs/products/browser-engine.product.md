# Product: BrowserEngine

## Tổng quan

`Chromium` là singleton public API -- điểm vào duy nhất bạn cần để điều khiển fingerprint browser. Dùng fluent pattern, bạn gọi `.useXxx()` để cấu hình, `.launch()` để khởi động, `.newContext()` để lấy Playwright BrowserContext, và `.quit()` để dọn dẹp.

## Ví dụ đầy đủ

```ts
import { Chromium } from 'fingerprint-chromium-engine';

// --- Cấu hình ---
Chromium
  .useFingerprint(fingerprintJson, {
    usePerfectCanvas: true,
    safeWebGL: true,
    safeCanvas: true,
  })
  .useProxy('socks5://127.0.0.1:9050', {
    changeWebRTC: 'replace',
    enableTunneling: true,
    dnsMode: 'custom-direct',
  })
  .useProfile('./profiles/my_profile', {
    loadProxy: true,
    loadFingerprint: true,
  });

// --- Launch ---
await Chromium.launch({
  headless: false,
  args: ['--disable-web-security'],
});

// --- Lấy context ---
const context = await Chromium.newContext();
const page = await context.newPage();
await page.goto('https://example.com');

// --- Dọn dẹp ---
await Chromium.quit();
```

## Lifecycle Rules

| Gọi method | Khi chưa launch | Sau launch | Sau quit |
|---|---|---|---|---|
| `launch()` | OK | Throw (1 lần) | OK |
| `newContext()` | Throw | OK (1 lần) | Throw |
| `quit()` | No-op | OK | No-op |
| `useFingerprint()` | OK | OK | OK |
| `useProxy()` | OK | OK | OK |
| `useProfile()` | OK | OK | OK |

## Cleanup Chain

Khi gọi `quit()` (sau `newContext()`), các tài nguyên được dọn dẹp theo thứ tự:

```
1. BrowserContext.close()          -- đóng context, giải phóng port
2. browser.close()                 -- taskkill worker.exe
3. engine.kill()                   -- kill FastExecuteScript.exe
4. pcapServer.close()              -- close TCP mock server
5. mutex.release()                 -- release BASProcess{pid}
6. cleaner.stop()                  -- clearInterval + unlock files
7. dataManager.unmap()             -- xoá thư mục tạm
```

Tất cả các bước đều an toàn khi gọi nhiều lần (idempotent), dùng try/catch nội bộ.

## Profile Safety

Khi bạn gọi `useProfile('./profiles/user')`, dữ liệu được:

1. **Copy** vào thư mục tạm `<BROWSER_RUNNING_DIR>/profile/<timestamp>_<random4hex>/`
2. **Browser chạy trên bản copy** -- không corrupt dữ liệu gốc
3. **Khi quit**: copy ngược lại thư mục gốc, xoá thư mục tạm

Nếu browser crash, profile gốc vẫn an toàn. Thư mục tạm được CleanupDaemon dọn sau.

## Custom Launcher

Bạn có thể thay thế Playwright launcher mặc định:

```ts
import { chromium } from 'playwright-extra';

Chromium.repackChromium({
  launch: (opts) => chromium.launch(opts),
  launchPersistentContext: (dir, opts) => chromium.launchPersistentContext(dir, opts),
});
```

**Lưu ý:** `repackChromium()` không reset config -- fingerprint/proxy/profile đã cấu hình vẫn được áp dụng khi gọi `launch()`.

## Môi trường

| Biến | Mục đích | Mặc định |
|---|---|---|
| `BABLOSOFT_KEY` | Key bảo mật cho API engine | `''` |
| `BROWSER_RUNNING_DIR` | Thư mục tạm cho browser đang chạy | `.tmp/browser/running` |
| `ENGINE_WORKING_DIR` | Thư mục làm việc của engine | `.tmp/browser/engine` |

---
