# Plan: Tách Known Issues ra file riêng

## Các bước thực hiện

- [x] Bước 1: Tạo `docs/KNOWN_ISSUES.md`
    - Làm gì: Copy Known Issues từ Welcome.md sang file mới.
    - Giữ nguyên cấu trúc OPEN/FIXED, link, formatting.

- [x] Bước 2: Sửa `docs/Welcome.md`
    - Xoá Known Issues chi tiết, thêm link summary + số lượng issue.
    - Thêm KNOWN_ISSUES.md vào sơ đồ cấu trúc thư mục.

- [x] Bước 3: Sửa `docs/WORKFLOW.md`
    - Thêm KNOWN_ISSUES.md vào cấu trúc thư mục.

## Kiểm tra

- `npm run lint`
- Mở Welcome.md, click link KNOWN_ISSUES.md -- hoạt động.
- KNOWN_ISSUES.md nội dung khớp issue cũ.
- WORKFLOW.md hiển thị KNOWN_ISSUES.md trong cấu trúc.

## Ghi chú

- Non-feature task: chỉ thao tác trên file markdown, không cần product doc.
