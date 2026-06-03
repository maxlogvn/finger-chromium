# Overview: Bug #11 — `defaultLauncher` mutable state

## Tóm tắt

Đã loại bỏ `defaultLauncher` khỏi module scope trong `src/adapter/playwright/engine.ts`. Thay bằng `createDefaultLauncher()` factory function. `BrowserEngine` constructor nhận `launcher?` param để inject mock dễ dàng khi unit test. Tất cả các bước trong plan hoàn thành đúng kế hoạch.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Sửa `engine.ts` | Xoá module-level state, thêm factory function, sửa constructor | Hoàn thành | Không có |
| Bước 2: Sửa `chromium.ts` | Thêm `launcher?` param vào constructor | Hoàn thành | Không có |
| Bước 3: Kiểm tra | lint + typecheck + build + test pass | Tất cả pass | Không có |
| Bước 4: Rà soát tài liệu | Cập nhật KNOWN_ISSUES.md | Hoàn thành | Không có |
| Bước 5: Viết overview | Viết overview | Hoàn thành | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-011-default-launcher.design.md`
- `docs/specs/bug-011-default-launcher.spec.md`
- `docs/plans/bug-011-default-launcher.plan.md`
- `docs/KNOWN_ISSUES.md` (đã cập nhật)
- `docs/ROADMAP.md` (đã cập nhật)

## Ghi chú

- `defaultLoader` (`loader.ts`) vẫn là module-level singleton nhưng chỉ chứa config strings, không phải vấn đề cần xử lý.
- Pending: cần đóng GitHub issue #3 sau khi commit.
