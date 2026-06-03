# Design: Bug #13 -- Cleaner singleton dùng chung giữa các BrowserEngine instance

## Bối cảnh

Hiện tại `src/plugin/cleaner.ts` export một singleton:

```ts
export default new SettingsCleaner();
```

Và `src/plugin/index.ts` import trực tiếp singleton đó:

```ts
import cleaner from './cleaner';
// ...
await cleaner.watch(pwd).ignore(pwd, pid, id);
// ...
await configFn(() => cleaner.include(pwd, pid, id), ...);
// ...
await cleaner.stop();
```

Mỗi `FingerprintPlugin` instance (và do đó mỗi `BrowserEngine`) đều dùng chung một `SettingsCleaner`. Khi một instance gọi `cleaner.stop()`, nó xoá toàn bộ folder đã watch và unlock toàn bộ files -- gây race condition với instance khác.

## Câu hỏi làm rõ

- Có ai khác ngoài `FingerprintPlugin` và file test dùng `cleaner` không? → Chỉ có `src/plugin/index.ts` và `tests/quit-cleanup.test.ts`.
- Singleton cleaner có cần giữ cho backward compatibility không? → Có, vì test `quit-cleanup.test.ts` import nó.
- `FingerprintPlugin` có cần factory/option để inject cleaner không? → Có thể, nhưng đơn giản nhất là tạo instance riêng trong constructor.

## Các phương án

### Phương án 1: Export class + mỗi instance có cleaner riêng

- Export `SettingsCleaner` class dưới dạng named export.
- Giữ `export default new SettingsCleaner()` cho backward compatibility.
- `FingerprintPlugin` tạo `#cleaner = new SettingsCleaner()` riêng.
- Các method của `FingerprintPlugin` dùng `this.#cleaner` thay vì singleton.

Ưu điểm:
- Đơn giản, ít thay đổi.
- Backward compatible (singleton vẫn tồn tại).
- Không cần sửa test.

Nhược điểm:
- Singleton cleaner vẫn tồn tại, có thể bị dùng nhầm sau này.

### Phương án 2: Xoá singleton hoàn toàn

- Xoá `export default new SettingsCleaner()`.
- Export class `SettingsCleaner` duy nhất.
- Mọi nơi đều phải tự tạo instance.

Ưu điểm:
- Dứt điểm, không còn singleton.
- Buộc mọi consumer phải tạo instance riêng.

Nhược điểm:
- Phá vỡ backward compatibility -- test và code tích hợp bên ngoài cần sửa.

### Phương án 3: Factory + inject pattern

- `FingerprintPlugin` nhận `cleaner?: SettingsCleaner` trong constructor.
- Nếu không truyền, tự tạo instance mới.

Ưu điểm:
- Flexible, test có thể inject mock cleaner.

Nhược điểm:
- Over-engineer cho vấn đề đơn giản.
- Thêm param vào constructor -- cần sửa `BrowserEngine` và `PlaywrightFingerprintPlugin`.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1.
- **Lý do:** Ít thay đổi nhất, backward compatible, không cần sửa test hiện tại. Singleton vẫn tồn tại cho ai muốn dùng nhưng `FingerprintPlugin` chính thức không còn phụ thuộc vào nó.
