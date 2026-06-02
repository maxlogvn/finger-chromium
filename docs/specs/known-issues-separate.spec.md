# Spec: Tách Known Issues ra file riêng

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Tách phần Known Issues từ `docs/Welcome.md` sang file `docs/KNOWN_ISSUES.md` riêng, giúp phân tách rõ ràng giữa tài liệu onboarding và tài liệu tracking issue.

## Yêu cầu

- Known Issues trong Welcome.md chuyển sang KNOWN_ISSUES.md, giữ nguyên cấu trúc OPEN/FIXED.
- Welcome.md giữ lại link dẫn đến KNOWN_ISSUES.md + dòng tóm tắt số lượng issue.
- Cấu trúc thư mục docs trong Welcome.md và WORKFLOW.md cập nhật thêm KNOWN_ISSUES.md.

## Thiết kế

Xem [Design](../designs/known-issues-separate.design.md).

## API / Data flow

Không có API. Thay đổi tài liệu thuần tuý:
- Welcome.md: xoá Known Issues chi tiết, thêm link + summary.
- KNOWN_ISSUES.md: chứa toàn bộ nội dung Known Issues.
- WORKFLOW.md: thêm KNOWN_ISSUES.md vào cấu trúc thư mục.

## Components

| File | Thay đổi |
|---|---|
| `docs/Welcome.md` (sửa) | Xoá Known Issues detail, thêm link summary |
| `docs/KNOWN_ISSUES.md` (tạo mới) | Toàn bộ nội dung Known Issues |
| `docs/WORKFLOW.md` (sửa) | Thêm KNOWN_ISSUES.md vào cấu trúc thư mục |

## Xử lý lỗi

- KNOWN_ISSUES.md đã tồn tại → báo lỗi và không ghi đè.
- Link Welcome.md trỏ sai → kiểm tra sau khi tạo file.

## Kiểm tra

- `npm run lint` -- ESLint pass (không ảnh hưởng source code).
- Kiểm tra thủ công: mở Welcome.md, xác nhận link KNOWN_ISSUES.md hoạt động.
