# Spec: Tách Known Issues ra file riêng

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả
Tách phần Known Issues từ `docs/Welcome.md` sang file `docs/KNOWN_ISSUES.md` riêng, giúp phân tách rõ ràng giữa tài liệu onboarding và tài liệu tracking issue.

## Yêu cầu
- Known Issues trong Welcome.md được chuyển sang KNOWN_ISSUES.md, giữ nguyên cấu trúc OPEN/FIXED.
- Welcome.md giữ lại link dẫn đến KNOWN_ISSUES.md + dòng tóm tắt số lượng issue.
- Cấu trúc thư mục docs trong Welcome.md và WORKFLOW.md được cập nhật để liệt kê KNOWN_ISSUES.md.

## Thiết kế
Tham chiếu design doc: `docs/designs/known-issues-separate.design.md`

## API / Data flow
Không có API. Đây là thay đổi tài liệu thuần túy:
- Welcome.md: xoá phần Known Issues chi tiết, thêm link + summary.
- KNOWN_ISSUES.md: chứa toàn bộ nội dung Known Issues (giữ nguyên).
- WORKFLOW.md: thêm KNOWN_ISSUES.md vào cấu trúc thư mục.

## Components
- `docs/Welcome.md` (sửa) — xoá Known Issues detail, thêm link summary.
- `docs/KNOWN_ISSUES.md` (tạo mới) — toàn bộ nội dung Known Issues.
- `docs/WORKFLOW.md` (sửa) — thêm KNOWN_ISSUES.md vào cấu trúc thư mục mẫu.

## Xử lý lỗi
- File KNOWN_ISSUES.md đã tồn tại → báo lỗi và không ghi đè.
- Link trong Welcome.md trỏ sai → kiểm tra sau khi tạo file.

## Kiểm tra
- `npm run lint` — ESLint pass (không ảnh hưởng tới source code, chỉ verify config).
- Kiểm tra thủ công: mở Welcome.md, xác nhận link đến KNOWN_ISSUES.md hoạt động.
- Kiểm tra thủ công: mở KNOWN_ISSUES.md, xác nhận nội dung khớp với issue trong Welcome.md cũ.
