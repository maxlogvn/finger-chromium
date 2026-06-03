# Overview: Bug #20 — Hardcoded `await setTimeout(2000)` bên trong async-lock

## Tóm tắt

Đã giảm thời gian synchronize từ 4 giây xuống ~1 giây bằng cách thay `setTimeout(2000)` thành `setTimeout(pollInterval)` với mặc định 500ms, đồng thời cho phép cấu hình qua tham số `pollInterval`. Tất cả các bước trong plan hoàn thành đúng kế hoạch.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Cập nhật ROADMAP — Đang làm | Thêm entry Bug #20, đánh dấu "Đang làm" | Đã làm | Không có |
| Bước 2: Viết design | `docs/designs/bug-020-setTimeout-async-lock.design.md` | Đã làm | Không có |
| Bước 3: Viết spec | `docs/specs/bug-020-setTimeout-async-lock.spec.md` | Đã làm | Không có |
| Bước 4: Viết plan | `docs/plans/bug-020-setTimeout-async-lock.plan.md` | Đã làm | Không có |
| Bước 5: Code | Sửa `synchronize()` — thêm pollInterval param, giảm timeout | Đã làm | Không có |
| Bước 6: Kiểm tra | lint, typecheck, build, test | Pass: 0 lỗi lint, build thành công, 20/20 test | Không có |
| Bước 7: Rà soát tài liệu | Cập nhật KNOWN_ISSUES.md | Đã làm | Không có |
| Bước 8: Viết overview | File này | Đã làm | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-020-setTimeout-async-lock.design.md`
- `docs/specs/bug-020-setTimeout-async-lock.spec.md`
- `docs/plans/bug-020-setTimeout-async-lock.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #20 từ OPEN sang FIXED
- `docs/ROADMAP.md` — cập nhật trạng thái

## Ghi chú

- Tham số `pollInterval` được validate: âm/NaN → dùng mặc định 500ms, < 100ms → clamp lên 100ms.
- Backward compatible: không break caller hiện tại vì `pollInterval` là optional.
