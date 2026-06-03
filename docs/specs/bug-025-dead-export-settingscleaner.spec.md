# Spec: Dead export SettingsCleaner default

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Xoá dead export `export default new SettingsCleaner()` khỏi `src/plugin/cleaner.ts:118` ở phiên bản hiện tại
bằng cách thêm `@deprecated` JSDoc, và refactor file test duy nhất import nó sang dùng named export `SettingsCleaner`
với instance riêng.

## Yêu cầu

- Dòng `export default new SettingsCleaner()` phải có `@deprecated` JSDoc giải thích lý do và hướng dẫn thay thế.
- File test `tests/quit-cleanup.test.ts` phải import `{ SettingsCleaner }` thay vì default export, và tạo instance riêng.
- Runtime deprecation warning (Proxy) là optional, không bắt buộc.
- Không thay đổi hành vi production code.
- Tất cả test hiện tại phải pass sau khi refactor.

## Thiết kế

Tham chiếu design doc: `docs/designs/bug-025-dead-export-settingscleaner.design.md`

Giải pháp chọn: Phương án 1 (chỉ thêm `@deprecated` JSDoc + refactor test).

## API / Data flow

Không thay đổi API public. `@deprecated` JSDoc là documentation-only change.

### Thay đổi import flow (test only)

```
Trước:   import cleaner from '../src/plugin/cleaner';
         // dùng: cleaner.stop()

Sau:     import { SettingsCleaner } from '../src/plugin/cleaner';
         const cleaner = new SettingsCleaner();
         // dùng: cleaner.stop()
```

## Components

### `src/plugin/cleaner.ts` (sửa)

- Dòng 118 `export default new SettingsCleaner()` — thêm `@deprecated` JSDoc.

### `tests/quit-cleanup.test.ts` (sửa)

- Dòng 20 `import cleaner from '../src/plugin/cleaner'` — đổi thành `import { SettingsCleaner } from '../src/plugin/cleaner'`.
- Thêm `const cleaner = new SettingsCleaner()` ở đầu mỗi `describe('cleaner', ...)` block để tạo instance riêng.

## Xử lý lỗi

Không có xử lý lỗi mới — đây là refactor không thay đổi logic.

## Kiểm tra

- **Happy path:** Test `quit-cleanup.test.ts` pass với `SettingsCleaner` named import + instance mới.
- **Edge case:** `SettingsCleaner` instance mới chưa gọi `watch()` — `stop()` không throw.
- **Edge case:** Gọi `stop()` 2 lần — không throw.
- **Error case:** `export default` vẫn tồn tại (để backward compatibility) — không breaking change.
