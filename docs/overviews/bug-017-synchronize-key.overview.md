# Overview: Bug #17 — `synchronize` ghi `BAS_NOT_SET` cho `availWidth/availHeight`

## Tóm tắt

Đã fix `src/plugin/config.ts:synchronize()` — map đúng key `availWidth → width`, `availHeight → height` để lấy giá trị từ `bounds` thay vì tìm sai key name.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| Bước 1: Sửa config.ts | Map iniKey → boundsKey trong loop | Đã làm đúng | Không có |
| Bước 2: Kiểm tra | lint + build | lint pass (0 errors), build pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-017-synchronize-key.design.md`
- `docs/specs/bug-017-synchronize-key.spec.md`
- `docs/plans/bug-017-synchronize-key.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #17 từ OPEN sang FIXED

## Ghi chú

Cần close GitHub issue [#10](https://github.com/maxlogvn/finger-chromium/issues/10) tương ứng.
