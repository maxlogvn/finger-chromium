# Overview: npm run clean không tương thích Windows (Issue #17)

## Tóm tắt

Đã fix script `clean` trong `package.json` từ `rm -rf` (Unix-only) sang `tsup --clean` (cross-platform). `tsup --clean` xoá thư mục `dist/` trước khi build, tương thích hoàn toàn với Windows.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Sửa package.json script | `rm -rf dist data` → `tsup --clean` | Đã sửa tại script `clean` | Không có |
| Bước 2: Kiểm tra | `npm run clean` trên Windows | Chạy thành công, không lỗi | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `package.json` — sửa script
- `docs/KNOWN_ISSUES.md` — chuyển #17 từ OPEN sang FIXED

## Ghi chú

- `rm -rf` không phải là command có sẵn trên Windows Command Prompt hay PowerShell.
- `tsup --clean` là giải pháp chính thống, đã có sẵn trong tsup.
