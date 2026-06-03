# Spec: BrowserEngine

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`BrowserEngine` là lớp triển khai public API `PWChromium`. Mỗi `new BrowserEngine()` là một instance độc lập, có cấu hình riêng. `Chromium` là alias của `BrowserEngine` cho backward compatibility. Nó cung cấp Fluent API để cấu hình fingerprint, proxy, profile, sau đó launch engine, tạo `BrowserContext` Playwright, và dọn dẹp khi kết thúc.

`BrowserEngine` không tự inject fingerprint. Nó là lớp điều phối: nhận cấu hình từ user, chuyển xuống `PlaywrightFingerprintPlugin`, gọi `launchPersistentContext()` để bridge vào plugin core, và quản lý vòng đời của `BrowserContext`.

Source: `src/adapter/playwright/chromium.ts` (231 dòng).

## Yêu cầu

- Export class `BrowserEngine` — mỗi `new BrowserEngine()` tạo instance độc lập. `Chromium` là alias class.
- Hỗ trợ Fluent API: mọi method config trả về `this` để chain.
- `launch()` chỉ được gọi một lần — guard bằng `isLaunched` flag.
- `newContext()` phải gọi sau `launch()`, trước `quit()`.
- `newContext()` chỉ tạo một context — muốn tạo mới phải `quit()` trước.
- `quit()` phải idempotent — gọi trước `launch()` hoặc nhiều lần đều an toàn.
- `quit(saveDataPath?)` cho phép lưu profile vào đường dẫn khác.

## Thiết kế

### Kiến trúc tổng quan

```
BrowserEngine (class, mỗi instance độc lập)
  ├── engine: PlaywrightFingerprintPlugin
  ├── dataManager: AdapterDataManager
  ├── context: BrowserContext
  └── config fields
```

`BrowserEngine` giữ cấu hình trong private fields, không expose ra ngoài. Mỗi field lưu tuple `[value, options?]` để khi `launch()` gọi, chuyển nguyên cụm xuống plugin.

Tham chiếu design doc: `docs/designs/browser-engine.design.md`.

### Luồng launch

1. `useFingerprint()`, `useProxy()`, `useProfile()` chỉ lưu vào field — không gọi engine.
2. `useProfile()` gọi `dataManager.map(dirPath)` tạo bản copy profile vào temp dir. Lý do: browser chạy trên bản copy, nếu crash không corrupt profile gốc.
3. `launch()` hợp nhất options từ 3 nguồn: mặc định < config trước < tham số launch.
4. `launch()` đẩy key, working folder, profile xuống engine. Gọi `useProxy`/`useFingerprint` nếu đã đăng ký.
5. `newContext()` hợp nhất options lần cuối, gọi `engine.launchPersistentContext(profilePath, options)`.
6. `quit()` đóng context → lưu profile (nếu có save path) → cleanup engine → dispose temp dir (chỉ xoá instanceTempDir của instance hiện tại, không xoá thư mục gốc BROWSER_RUNNING_DIR).

### Guard một lần

`launch()` set `this.isLaunched = true`. Lần gọi thứ hai throw error. `newContext()` kiểm tra `isLaunched` và `context` tồn tại. `quit()` kiểm tra `isLaunched` và return sớm nếu chưa launch — không throw.

Lý do guard một lần ở `BrowserEngine` thay vì `FingerprintPlugin`: user chỉ nên có một pipeline fingerprint duy nhất. Plugin core không cần guard vì nó có thể được dùng linh hoạt hơn bởi internal code.

## API / Data flow

### Input

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';
import type { PluginLaunchOptions } from 'fingerprint-chromium-engine';

const engine = new BrowserEngine();

// Config methods — lưu vào field, trả về this
engine.repackChromium(customLauncher);          // thay launcher mặc định
engine.useFingerprint(jsonData, options);        // lưu fingerprint
engine.useProxy(url, options);                   // lưu proxy
engine.useProfile(dirPath, options);             // map profile + lưu
engine.launch(options);                          // khởi động engine
engine.newContext(options);                      // tạo BrowserContext
engine.quit(saveDataPath);                       // dọn dẹp
```

### Output

- `launch()` → `this` (để chain `newContext()`).
- `newContext()` → `Promise<BrowserContext>` — context Playwright có fingerprint.
- `quit()` → `Promise<void>`.
- `newFingerprint(options)` → `Promise<string | undefined>` — JSON string từ service.
- `repackChromium()` → `this` — thay launcher mặc định (gọi trước `launch()`).

### Luồng dữ liệu

```
User code
  │
  ├─ useFingerprint() ─── lưu [data, options]
  ├─ useProxy() ───────── lưu [url, options]
  ├─ useProfile() ─────── map profile → temp dir → lưu [tempPath, options]
  │
  └─ launch() ─────────── hợp nhất options
       │                   setServiceKey()
       │                   setWorkingFolder()
       │                   engine.useProfile(tempPath, options)
       │                   engine.useProxy() (nếu có)
       │                   engine.useFingerprint() (nếu có)
       │
       └─ newContext() ─── engine.launchPersistentContext(tempPath, options)
            │
            └─ BrowserContext (có fingerprint)
```

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/adapter/playwright/chromium.ts` | `BrowserEngine` class + `Chromium` alias | 228 |
| `src/adapter/playwright/data.ts` | `AdapterDataManager` — map/unmap profile, copy temp dir | — |
| `src/adapter/playwright/engine.ts` | `PlaywrightFingerprintPlugin` — bridge từ đây xuống plugin core | 111 |
| `src/types/PWChromium.ts` | Interface `PWChromium` — public API contract | — |

## Constants

| Constant | Giá trị | Vì sao cần |
|---|---|---|
| `PRIVATE_KEY` | `process.env.BABLOSOFT_KEY ?? ''` | Engine cần key để gọi service. Lấy từ env, không có setter public vì flow chuẩn là dùng env. |
| `BROWSER_RUNNING_DIR` | `cwd + env BROWSER_RUNNING_DIR` hoặc `.tmp/browser/running` | Tách dữ liệu runtime khỏi profile gốc — tránh corrupt. |
| `ENGINE_WORKING_DIR` | `cwd + env ENGINE_WORKING_DIR` hoặc `.tmp/browser/engine` | Gom engine binary và metadata vào một chỗ có thể dọn được. |
| `DEFAULT_CONTEXT_OPTIONS` | `{ headless: false, hasTouch: true }` | `headless: false` vì fingerprint check phát hiện headless. `hasTouch: true` giả lập thiết bị cảm ứng — nhiều fingerprint profile mặc định có touch. |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| `launch()` gọi lần thứ hai | Throw `Error('[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan.')` |
| `newContext()` trước `launch()` | Throw `Error('[BrowserEngine] Phai goi launch() truoc khi tao context.')` |
| `newContext()` khi context đã tồn tại | Throw `Error('[BrowserEngine] Context da duoc tao. Vui long goi quit() truoc khi tao moi.')` |
| `quit()` khi chưa launch | Return sớm, không throw — idempotent |
| `newContext()` fail do engine | Engine throw `PluginError` / `MissingKeyError` / `EngineTimeoutError` |
| `quit()` fail khi close context | Lỗi bị `catch(() => {})` — không crash toàn bộ cleanup |

## Kiểm tra

- Happy path: `useFingerprint()` → `useProxy()` → `useProfile()` → `launch()` → `newContext()` → dùng page → `quit()`.
- Error: `launch()` hai lần → throw.
- Error: `newContext()` trước `launch()` → throw.
- Error: `newContext()` hai lần liên tiếp → throw (cần `quit()` ở giữa).
- Idempotent: `quit()` khi chưa launch → không throw.
- Profile: `quit(saveDataPath)` lưu vào đường dẫn khác.
- Constants: giá trị mặc định của `headless`, `hasTouch` đúng spec.
