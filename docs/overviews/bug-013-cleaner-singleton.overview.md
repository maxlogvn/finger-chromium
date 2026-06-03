# Overview: Bug #13 -- Cleaner singleton dùng chung giữa các BrowserEngine instance

## Tóm tắt

Đã fix bug #13: `SettingsCleaner` là singleton global khiến các `BrowserEngine` instance dùng chung một cleaner, gây race condition khi một instance stop cleaner ảnh hưởng đến instance khác.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm export class SettingsCleaner | Thêm `export` trước `class SettingsCleaner` | Đã thêm `export class SettingsCleaner` | Không có |
| Bước 2: FingerprintPlugin dùng instance riêng | Đổi import, thêm `#cleaner`, dùng `this.#cleaner.*` | Đã thay đổi import, thêm private field `#cleaner`, đổi 3 lệnh gọi | Không có |
| Bước 3: Kiểm tra | lint, typecheck, test | lint 0 errors, 20 tests pass, build success | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-013-cleaner-singleton.design.md`
- `docs/specs/bug-013-cleaner-singleton.spec.md`
- `docs/plans/bug-013-cleaner-singleton.plan.md`
- `docs/KNOWN_ISSUES.md` -- chuyển #13 từ OPEN sang FIXED

## Ghi chú

Singleton `export default new SettingsCleaner()` vẫn được giữ cho backward compatibility. Các test hiện tại dùng singleton không cần sửa.
