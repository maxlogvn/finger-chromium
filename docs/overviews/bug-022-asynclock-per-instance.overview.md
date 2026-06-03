# Overview: Chuyển AsyncLock từ module-level sang per-instance (Bug fix #22)

## Tóm tắt

Đã refactor `AsyncLock` trong `src/plugin/config.ts` từ module-level singleton thành class `ConfigManager` với lock riêng cho mỗi `FingerprintPlugin` instance. Giải quyết contention khi nhiều instance chạy song song.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| Bước 1: Thêm class ConfigManager vào config.ts | Tạo class với `#lock` riêng, chuyển logic configure/synchronize thành method | Hoàn thành | Không có |
| Bước 2: Cập nhật index.ts — import và dùng ConfigManager | Đổi import, thêm `#configManager` field, update `_launch()` | Hoàn thành | Phát hiện thêm `configure()` method ở dòng 233-234 cũng tham chiếu module-level `configure` — đã fix song song |
| Bước 3: Kiểm tra | lint, typecheck, build, test đều pass | Pass | Không có |

## Sai lệch đáng chú ý

- **Sai lệch 1:** Trong `FingerprintPlugin.configure()` (dòng 233-234), tham chiếu `typeof configure === 'function'` trỏ đến module-level `configure` đã bị xoá. Đã phát hiện qua `npm run typecheck` và sửa thành `typeof this.#configManager.configure === 'function'`.
    - Nguyên nhân: Không nằm trong scope của plan ban đầu vì code này ít được dùng (chỉ fallback khi subclass không override `configure`).
    - Hướng xử lý đã áp dụng: Sửa tham chiếu trực tiếp.
    - Ảnh hưởng đến plan/spec: Không cần cập nhật — đây là lỗi type check phát hiện tự nhiên trong bước kiểm tra.

## Tài liệu liên quan

- `docs/designs/bug-022-asynclock-per-instance.design.md`
- `docs/specs/bug-022-asynclock-per-instance.spec.md`
- `docs/plans/bug-022-asynclock-per-instance.plan.md`
- `docs/overviews/bug-022-asynclock-per-instance.overview.md` (file này)
- `src/plugin/config.ts` — đã sửa
- `src/plugin/index.ts` — đã sửa

## Ghi chú

- `PlaywrightFingerprintPlugin.configure()` override không bị ảnh hưởng.
- Khi review code, chú ý pattern per-instance đã nhất quán trên cả 3 module: `Connector`, `Cleaner`, `ConfigManager`.
