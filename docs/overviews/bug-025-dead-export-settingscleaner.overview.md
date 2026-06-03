# Overview: Dead export SettingsCleaner default

## Tóm tắt

Đã xử lý dead export `export default new SettingsCleaner()` trong `src/plugin/cleaner.ts:118`
bằng cách thêm `@deprecated` JSDoc và refactor file test duy nhất import nó sang dùng named export
`SettingsCleaner` với instance riêng. Không thay đổi hành vi production code.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm `@deprecated` JSDoc | Thêm JSDoc block phía trên `export default new SettingsCleaner()` | Đã thêm JSDoc với thẻ `@deprecated`, giải thích lý do và hướng dẫn thay thế | Không có |
| Bước 2: Refactor test | Đổi `import cleaner from '../src/plugin/cleaner'` thành `import { SettingsCleaner }` + `new SettingsCleaner()` | Đã đổi import và thêm `const cleaner = new SettingsCleaner()` trong describe block | Không có |
| Bước 3: Chạy kiểm tra | `npm run lint`, `npm run typecheck`, `npm test` | Lint pass (0 errors), typecheck pass, 20 tests pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-025-dead-export-settingscleaner.design.md`
- `docs/specs/bug-025-dead-export-settingscleaner.spec.md`
- `docs/plans/bug-025-dead-export-settingscleaner.plan.md`
- `docs/overviews/bug-025-dead-export-settingscleaner.overview.md`
- `docs/KNOWN_ISSUES.md` -- chuyển #25 từ OPEN sang FIXED
- `docs/ROADMAP.md` -- cập nhật trạng thái

## Ghi chú

- `export default new SettingsCleaner()` vẫn tồn tại để backward compatibility. Sẽ xoá hoàn toàn ở major version 2.0.
- Không thêm Proxy deprecation warning vì đây là optional và issue không yêu cầu bắt buộc.
