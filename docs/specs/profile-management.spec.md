# Spec: Quản lý Profile

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Tính năng profile lưu và tái sử dụng dữ liệu trình duyệt (cookie, localStorage, session) giữa các lần chạy. Profile được copy vào thư mục tạm trước khi browser khởi động — tránh corrupt dữ liệu gốc — và được sao lưu lại sau khi kết thúc session.

Ngoài ra, engine tự động load lại proxy và fingerprint đã dùng lần trước từ profile nếu `loadProxy` / `loadFingerprint` là `true`.

Source: `src/adapter/playwright/data.ts` (86 dòng), `src/types/profile.ts` (30 dòng).

## Yêu cầu

- Copy profile từ thư mục gốc sang thư mục tạm trước khi launch.
- Tạo tên temp dir duy nhất (timestamp + random hex) để tránh xung đột.
- `map(source)` → copy source → temp. `map(temp, dest)` → copy temp → dest.
- Xoá temp dir khi kết thúc session (`unmap()`).
- Hỗ trợ map ngược: copy từ temp dir về thư mục đích sau khi close context.
- Tuỳ chọn load lại proxy và fingerprint từ profile cũ.

## Thiết kế

### AdapterDataManager

```
AdapterDataManager
  ├── instanceTempDir: BROWSER_RUNNING_DIR/profile/{timestamp}_{hex}
  ├── map(sourceDir) ────────── copy source → instanceTempDir
  ├── map(tempDir, destDir) ─── copy tempDir → destDir
  ├── unmap(tempDir) ────────── xoá thư mục
  └── dispose() ─────────────── xoá instanceTempDir
```

### Luồng lifecycle

```
BrowserEngine.useProfile(dirPath, options)
  │
  ├─ dataManager.map(dirPath) ─── copy dirPath → temp dir
  │
  └─ launch()
       ├─ engine.useProfile(tempPath, options)
       └─ engine._launch() gửi tempPath lên engine
            │
            └─ Browser chạy trên temp dir

BrowserEngine.quit(saveDataPath?)
  │
  ├─ context.close()
  │
  ├─ dataManager.map(tempPath, saveDataPath ?? dirPath)
  │    └─ copy temp → gốc
  │
   └─ dataManager.dispose()
        └─ xoá temp dir của instance hiện tại
```

Tại sao dùng temp dir? Nếu browser crash trong lúc chạy, profile gốc vẫn còn nguyên. Nếu không có temp dir, crash có thể corrupt thư mục profile.

Tham chiếu design doc: `docs/designs/profile-management.design.md`.

## API / Data flow

```ts
import { AdapterDataManager } from './adapter/playwright/data';

const manager = new AdapterDataManager({
  tempRootDir: '.tmp/browser/running/profile',
});

// Map source → temp (trước launch)
const tempPath = manager.map('./profiles/user_01');
// tempPath = ".tmp/browser/running/profile/1685000000_abcd"

// Map temp → dest (sau quit)
manager.map(tempPath, './profiles/user_01');

// Xoá temp
manager.unmap(tempPath);
```

### ProfileOptions

```ts
interface ProfileOptions {
  loadProxy?: boolean;        // @default true
  loadFingerprint?: boolean;  // @default true
}
```

### Input / Output

- `map(sourceDir)` → `Promise<string>` (path đến temp dir).
- `map(tempDir, destinationDir)` → `Promise<string>` (path đến destination).
- `unmap(tempDir)` → void.
- `dispose()` → void.

## Components

| File | Vai trò | Dòng |
|---|---|---|
| `src/adapter/playwright/data.ts` | `AdapterDataManager` — map/unmap/dispose | 86 |
| `src/adapter/playwright/chromium.ts` | `useProfile()` — gọi dataManager.map | 193 |
| `src/types/profile.ts` | `ProfileOptions` type | 30 |

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Source profile không tồn tại hoặc không đọc được | Throw `PluginError('Sao chép thất bại: ...')` với path chi tiết |
| Không có quyền ghi temp dir | `fs.cpSync` throw — propagate lên caller |
| `unmap()` — temp dir không tồn tại | `console.warn` — không throw |
| `unmap()` — xoá thất bại (file locked) | Throw `PluginError('[DataManager] Dọn dẹp thất bại: ...')` |

## Kiểm tra

- Happy path: profile → copy vào temp → browser chạy → quit → copy ngược → xoá temp.
- Edge case: profile rỗng (folder mới tạo) → vẫn copy thành công.
- Edge case: profile không tồn tại → throw error.
- Edge case: `unmap()` gọi 2 lần → lần 2 warn, không throw.
- Temp dir naming: `{timestamp}_{4hex}` — duy nhất.
