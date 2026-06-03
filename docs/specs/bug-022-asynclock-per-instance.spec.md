# Spec: Chuyển AsyncLock từ module-level sang per-instance

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Chuyển `AsyncLock` trong `src/plugin/config.ts` từ module-level singleton thành per-instance bằng cách refactor thành class `ConfigManager`. Giải quyết contention khi nhiều `FingerprintPlugin` instance chạy song song.

## Yêu cầu

- `synchronize()` phải dùng `AsyncLock` riêng của từng instance, không chia sẻ giữa các instance.
- `configure()` phải dùng `ConfigManager` instance tương ứng để gọi `synchronize()`.
- Không thay đổi hành vi hiện tại của `synchronize()` hay `configure()` — chỉ thay đổi nơi chứa lock.
- `PlaywrightFingerprintPlugin.configure()` (override) giữ nguyên — không bị ảnh hưởng.

## Thiết kế

Tham chiếu: `docs/designs/bug-022-asynclock-per-instance.design.md`

Kiến trúc:

```
FingerprintPlugin
  └── #configManager: ConfigManager     (mới)
        ├── #lock: AsyncLock            (per-instance, thay vì module-level)
        ├── configure()                 (logic cũ từ module-level function)
        └── synchronize()               (logic cũ từ module-level function)

ConfigManager (class mới)
  - configure(cleanup, browser, bounds, sync) → Promise<void>
  - synchronize(id, pwd, bounds, action, pollInterval?) → Promise<void>
```

## API / Data flow

Chữ ký hàm giữ nguyên (không thay đổi params hay return type):

```ts
class ConfigManager {
  async configure(cleanup, browser, bounds, sync): Promise<void>
  async synchronize(id, pwd, bounds, action, pollInterval?): Promise<void>
}
```

Luồng dữ liệu:
1. `FingerprintPlugin._launch()` → `this.#configManager.configure(cleanup, browser, bounds, this.#configManager.synchronize.bind(this.#configManager, id, pwd, bounds))`
2. `ConfigManager.configure()` → gọi `sync` wrapper (là `synchronize.bind(...)`)
3. `ConfigManager.synchronize()` → `this.#lock.acquire(id, ...)` — lock riêng của instance

## Components

### Sửa đổi

| File | Thay đổi |
|------|----------|
| `src/plugin/config.ts` | Bỏ module-level `lock`, thêm class `ConfigManager` với `#lock` riêng. Export `ConfigManager` thay vì 2 function riêng lẻ. |
| `src/plugin/index.ts` | Import `ConfigManager` thay vì `{ configure, synchronize }`. Thêm `#configManager` field. Dùng `this.#configManager.configure()` và `this.#configManager.synchronize()`. |
| `src/adapter/playwright/engine.ts` | Kiểm tra không ảnh hưởng — `PlaywrightFingerprintPlugin.configure()` override độc lập, không gọi `config.ts`. |

### Giữ nguyên

- `src/plugin/config.ts`: `getValidPollInterval()` helper, `ViewportBounds` type, `ConfigureOptions` type — vẫn là module-level export vì không có state.
- `src/adapter/playwright/engine.ts`: `PlaywrightFingerprintPlugin.configure()` — không thay đổi.

## Xử lý lỗi

- Không có lỗi mới phát sinh từ refactor này — logic giữ nguyên, chỉ thay đổi nơi chứa state.
- Nếu `ConfigManager` chưa được gán (undefined) khi gọi method → `TypeError` tự nhiên từ JS runtime (giống các `#cleaner`/`#connector` hiện tại).

## Kiểm tra

- **Happy path:** Một instance gọi `synchronize()` — lock acquire/release thành công.
- **Multi-instance:** Hai `FingerprintPlugin` instance gọi `synchronize()` song song — không block lẫn nhau.
- **Edge case:** `ConfigManager` không ảnh hưởng đến `configure()` override của `PlaywrightFingerprintPlugin`.
- **Regression:** `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` đều pass.
