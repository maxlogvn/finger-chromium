# Spec: Bug #13 -- Cleaner singleton dùng chung giữa các BrowserEngine instance

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Hiện tại `SettingsCleaner` là singleton global (`export default new SettingsCleaner()`). Tất cả `FingerprintPlugin` instance đều dùng chung một cleaner -- khi một instance gọi `cleaner.stop()`, nó clear toàn bộ folders và unlock toàn bộ files, ảnh hưởng đến các instance khác. Cần cho phép mỗi instance có cleaner riêng.

## Yêu cầu

- `SettingsCleaner` class phải được export để consumer có thể tạo instance riêng.
- Singleton default `export default new SettingsCleaner()` được giữ cho backward compatibility.
- `FingerprintPlugin` phải dùng instance cleaner riêng, không dùng singleton.
- `FingerprintPlugin.cleanup()` chỉ stop cleaner của chính nó, không ảnh hưởng instance khác.
- Test hiện tại (`quit-cleanup.test.ts`) không cần sửa -- vẫn dùng singleton.

## Thiết kế

Tham chiếu design: `docs/designs/bug-013-cleaner-singleton.design.md` (Phương án 1).

## API / Data flow

### Cleaner exports (trước)
```ts
export default new SettingsCleaner();  // chỉ có singleton
```

### Cleaner exports (sau)
```ts
export class SettingsCleaner { ... }   // named export
export default new SettingsCleaner();  // giữ singleton
```

### FingerprintPlugin (trước)
```ts
import cleaner from './cleaner';
class FingerprintPlugin {
  // dùng cleaner trực tiếp
  await cleaner.watch(pwd).ignore(pwd, pid, id);
  await configFn(() => cleaner.include(pwd, pid, id), ...);
  await cleaner.stop();
}
```

### FingerprintPlugin (sau)
```ts
import { SettingsCleaner } from './cleaner';
// hoặc: import cleaner, { SettingsCleaner } from './cleaner';
class FingerprintPlugin {
  #cleaner = new SettingsCleaner();
  // dùng this.#cleaner
  await this.#cleaner.watch(pwd).ignore(pwd, pid, id);
  await configFn(() => this.#cleaner.include(pwd, pid, id), ...);
  await this.#cleaner.stop();
}
```

## Components

- `src/plugin/cleaner.ts` (sửa) -- thêm named export `SettingsCleaner` class.
- `src/plugin/index.ts` (sửa) -- import `SettingsCleaner` class, tạo instance riêng trong `FingerprintPlugin`.

## Xử lý lỗi

Không có thay đổi trong xử lý lỗi -- logic cleaner giữ nguyên, chỉ thay đổi cách tạo instance.

## Kiểm tra

- Test hiện tại (`quit-cleanup.test.ts`) dùng singleton -- không cần sửa.
- Cần kiểm tra: `FingerprintPlugin.cleanup()` không throw khi gọi 2 lần.
- Cần kiểm tra: hai `FingerprintPlugin` instance không ảnh hưởng cleaner của nhau.
