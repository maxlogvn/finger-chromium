# Spec: Test Cleanup (SettingsCleaner + ConfigManager + Mutex)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Viết unit test cho ba module cleanup: `cleaner.ts` (SettingsCleaner), `config.ts` (ConfigManager), và `mutex/index.ts` (Mutex). Test được tổ chức trong file `tests/cleanup.test.ts`. Dùng manual stub trên CJS module exports object (property mutation) để mock các dependency bên ngoài (proper-lockfile, fast-glob, async-lock, fs). Kết hợp integration style với temp directory thật cho fs operations. Sinon chỉ dùng cho global spies (`setInterval`/`clearInterval`). Không dùng proxyquire vì không tương thích với tsx/esm loader.

Tham chiếu design: `docs/designs/test-cleanup.design.md` - Phương án 2 (Proxyquire + Sinon) được chọn.

## Yêu cầu

### SettingsCleaner
- `watch()`: đăng ký thư mục mới, khởi động timer 15s nếu chưa có; gọi lại với folder cũ không thêm trùng.
- `ignore()`: gọi `lock.lock()` cho từng item trong `LOCKABLE_ITEMS(pid, id)`.
- `include()`: gọi `lock.unlock()` cho từng item.
- `stop()`: clear interval, quét folder, unlock các file còn locked, clear folders list.
- `#cleanup()`: quét file, xoá file hết hạn (`mtime > CLEANUP_INTERVAL`), bỏ qua file còn locked, bỏ qua file còn non-expired.
- `#toggleLock()`: lặp qua các item, gọi lock/unlock, bỏ qua ENOENT.

### ConfigManager
- `configure()`: đăng ký `process.on('exit')` hook cleanup, gọi `browser.configure()`, setViewport nếu có width/height.
- `synchronize()`: đọc file .ini, reset `availWidth`/`availHeight` về `BAS_NOT_SET`, ghi file, chờ `pollInterval`, action, set giá trị thật, ghi lại.
- `getValidPollInterval()` (helper private): validasi và clamp pollInterval — NaN/âm → 500ms, < 100ms → 100ms.

### Mutex
- Default export là object có `create` function.
- `create` là function.
- `release()`: gọi `mutex.close()` nếu là function, skip nếu không (no-op).

## Thiết kế

### Cấu trúc file test

```
tests/cleanup.test.ts
├── SettingsCleaner (describe)
│   ├── watch()
│   ├── ignore()
│   ├── include()
│   └── stop()
├── ConfigManager (describe)
│   ├── configure() — with/without viewport
│   ├── synchronize() — full flow
│   └── getValidPollInterval() — edge cases
└── Mutex (describe)
    ├── default export
    ├── create()
    └── release()
```

> **`#cleanup()` (private method):** Không test được. `cleaner.ts` dùng `#cleanup` (JS native private field) — không thể truy cập từ ngoài. Fake timers (sinon.useFakeTimers) không dùng được vì gây side effects với `Date.now()` và không await được async cleanup callback. Chỉ test `stop()` behavior unlock thay thế.

### Mock strategy

| Module | Dependency | Cách mock |
|---|---|---|
| **SettingsCleaner** | `proper-lockfile` (default import `lock`) | Manual stub: property mutation `lock.lock = async () => {}` trên CJS module exports object |
| | `fast-glob` (default import `fg`) | Integration style: dùng temp directory thật với file cần discover |
| | `fs/promises` (`rm`) | Integration style: dùng temp directory thật, verify file state sau operation |
| | `global.setInterval` / `global.clearInterval` | Sinon spy để verify timer behavior (global spy duy nhất) |
| **ConfigManager** | `async-lock` (default import `AsyncLock`) | Manual stub: property mutation `AsyncLock.prototype.acquire = fn => fn()` |
| | `./browser` (`setViewport`) | Không mock — test qua `sync` wrapper parameter thay vì verify setViewport call |
| | `fs/promises` (`readFile`, `writeFile`) | Integration style: tạo file .ini thật trong temp directory |
| | `timers/promises` (`setTimeout`) | Integration style: timer chạy thật (pollInterval delay) |
| **Mutex** | `module` (`createRequire`) | Dynamic import + try/catch — nếu mutex.node không tồn tại, test pass silently |

### Lưu ý về ESM mocking

Thay vì proxyquire (không tương thích với `tsx/esm`), dùng manual stub trên CJS module exports:

```ts
import lock from 'proper-lockfile';

// CJS module exports là object — mutation ảnh hưởng đến tất cả importers
lock.lock = async () => {};
lock.unlock = async () => {};
```

CJS module exports object (`proper-lockfile`, `async-lock`) → property mutation works across all ESM importers.
ESM module namespace (`node:fs/promises`, `node:timers/promises`) → dùng temp file thật (integration style).

## Components

- **Dependencies:** Sinon chỉ dùng cho global spies — không cài sinon vào devDependencies (manual stub đủ cho mọi mock). Xem deviation: plan ghi cài sinon nhưng không cần vì ESM constraints.
- **Tạo mới:** `tests/cleanup.test.ts` — file test duy nhất cho cả 3 module.
- **Không sửa code nguồn** — test dùng manual stub + integration style.

## Xử lý lỗi

| Tình huống | Kết quả mong đợi |
|---|---|
| `proper-lockfile.lock()` throw ENOENT | `#toggleLock()` catch silently, không throw |
| `proper-lockfile.check()` fail | `stop()` catch thành `false`, tiếp tục xử lý |
| `fg` trả về rỗng | `#cleanup()` không xoá gì, không throw |
| `readFile` fail (file không tồn tại) | `synchronize()` throw lỗi gốc |
| Mutex load fail trên platform không hỗ trợ | `PluginError` |

## Kiểm tra

### SettingsCleaner (9 test cases)

| Case | Input | Expected |
|---|---|---|
| `watch()` folder mới | `'/tmp/test'` | `#folders` có 1 phần tử, timer khởi động |
| `watch()` folder trùng | `'/tmp/test'` lần 2 | `#folders` chỉ có 1 phần tử, timer không tạo thêm |
| `watch()` timer unref | Gọi `watch()` với interval | `setInterval().unref()` được gọi |
| `ignore()` lock | `pid='123'`, `id='abc'` | `lock.lock()` được gọi 3 lần (t, s.ini, s1.ini) |
| `ignore()` ENOENT | `lock.lock()` throw ENOENT | Không throw, tiếp tục item tiếp theo |
| `include()` unlock | `pid='123'`, `id='abc'` | `lock.unlock()` được gọi 3 lần |
| `stop()` clear timer | Đã watch folder | `clearInterval` được gọi, timer = null |
| `stop()` unlock files | Folder có file locked | `lock.unlock()` được gọi cho từng file locked |
| `stop()` clear folders | — | `#folders = []` |

> **`#cleanup()` (3 test cases):** Không test được. `#cleanup` là JS native private field — không thể truy cập từ ngoài. Fake timers không dùng được vì side effects với `Date.now()` và không await được async callback. Xem deviation tại overview `test-cleanup.overview.md`.

### ConfigManager (10-12 test cases)

| Case | Input | Expected |
|---|---|---|
| `configure()` setViewport | width=1920, height=1080 | `setViewport` được gọi với bounds đúng |
| `configure()` không setViewport | width/height undefined | Không gọi `setViewport`, chỉ đăng ký exit handler |
| `configure()` exit handler | `browser.process.once('exit')` | Cleanup function được gọi khi exit event |
| `synchronize()` full flow | id, pwd, bounds, action | Đọc file → reset BAS_NOT_SET → ghi → chờ → action → set thật → ghi |
| `synchronize()` với action | action function | action được gọi đúng 1 lần |
| `synchronize()` multiple keys | width + height | Cả availWidth và availHeight đều được update |
| `getValidPollInterval()` undefined | undefined | 500 |
| `getValidPollInterval()` NaN | NaN | 500 |
| `getValidPollInterval()` -1 | -1 | 500 |
| `getValidPollInterval()` 50 | 50 | 100 (clamp) |
| `getValidPollInterval()` 300 | 300 | 300 (giữ nguyên) |

### Mutex (4 test cases)

| Case | Input | Expected |
|---|---|---|
| Default export là object | — | `typeof defaultExport === 'object'` |
| Default export có `create` | — | `typeof defaultExport.create === 'function'` |
| Named export `create` | — | `typeof create === 'function'` |
| Named export `release` no close | `mutex.close` undefined | `release()` không throw |
| Named export `release` with close | `mutex.close` là function | `mutex.close(name)` được gọi |
