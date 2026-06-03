# Design: Chuyển AsyncLock từ module-level sang per-instance

## Bối cảnh

Hiện tại `src/plugin/config.ts` khai báo `const lock = new AsyncLock()` ở module scope (dòng 34), và hai hàm `configure()` cùng `synchronize()` dùng chung lock này. Khi nhiều `FingerprintPlugin` instance chạy song song, tất cả đều tranh chấp một `AsyncLock` duy nhất — gây contention không cần thiết.

Vấn đề này là "sót" sau refactor per-instance trước đó (Issue #7: Connector factory, Issue #6: Cleaner singleton), nơi `Connector` và `Cleaner` đã được chuyển thành per-instance nhưng `config.ts` bị bỏ quên.

## Câu hỏi làm rõ

- `synchronize()` có cần dùng chung lock giữa các instance không? → Không, mỗi instance ghi vào file `.ini` riêng (theo `id`), không cần mutual exclusion giữa các instance.
- Có instance nào gọi `synchronize()` nhiều lần song song trên cùng `id` không? → Có thể nếu viewport thay đổi nhanh, nhưng lock per-instance vẫn đủ để serialise các call trên cùng instance.
- `configure()` có dùng lock không? → Không trực tiếp, `configure()` nhận `sync` wrapper từ bên ngoài (là `synchronize.bind(null, id, pwd, bounds)`).

## Các phương án

### Phương án 1: Class ConfigManager (ưu tiên)

Tạo class `ConfigManager` trong `config.ts` chứa `AsyncLock` riêng. `FingerprintPlugin` sở hữu `#configManager` instance.

- **Ưu điểm:**
  - Nhất quán với pattern `Connector` và `Cleaner` (per-instance).
  - Dễ test: mock được `ConfigManager` riêng cho từng test case.
  - Không ảnh hưởng đến API public vì `configure` và `synchronize` là internal.
- **Nhược điểm:**
  - Phải sửa cả `plugin/index.ts` và `adapter/playwright/engine.ts` để dùng instance method thay vì function.

### Phương án 2: WeakMap<object, AsyncLock>

Giữ nguyên module-level functions, dùng `WeakMap<object, AsyncLock>` để lưu lock theo instance gốc. Hàm `synchronize()` nhận thêm tham số `owner` (object reference) để tra lock.

- **Ưu điểm:**
  - Ít thay đổi code hơn (không cần refactor class).
- **Nhược điểm:**
  - `WeakMap` với object key khó dùng khi `synchronize` được gọi qua `bind()`.
  - Rò rỉ abstraction: tham số `owner` là implementation detail lộ ra API.
  - Không nhất quán với pattern per-instance hiện tại.

### Phương án 3: AsyncLock Map theo id

Tạo `Map<string, AsyncLock>` ở module scope, lock theo key `id` — mỗi `id` có lock riêng.

- **Ưu điểm:**
  - Thay đổi tối thiểu, không cần sửa đổi chữ ký hàm.
- **Nhược điểm:**
  - Rò rỉ bộ nhớ: `Map` giữ reference đến lock cũ nếu `id` không được dùng lại.
  - `id` từ setup response không đảm bảo unique tuyệt đối giữa các instance — có thể collision.
  - Không giải quyết triệt để vấn đề module-level state.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (Class ConfigManager).
- **Lý do:** Nhất quán với kiến trúc per-instance hiện tại, dễ test, không rò rỉ bộ nhớ, và đúng với tinh thần "mỗi instance có state riêng".
- **Ràng buộc:**
  - `ConfigManager` chỉ dùng nội bộ, không export ra public API.
  - `FingerprintPlugin._launch()` phải được cập nhật để dùng `this.#configManager` thay vì import function.
  - `PlaywrightFingerprintPlugin.configure()` vẫn giữ nguyên (nó override hoàn toàn luồng configure).
