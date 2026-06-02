# Plan: Tách Known Issues ra file riêng

## Các bước thực hiện

- [ ] Bước 1: Tạo file `docs/KNOWN_ISSUES.md`
    - Làm gì: Copy toàn bộ phần Known Issues từ Welcome.md (từ dòng `## Known Issues` đến hết file) vào file mới.
    - File liên quan: `docs/Welcome.md` (đọc), `docs/KNOWN_ISSUES.md` (tạo)
    - Ghi chú: Giữ nguyên cấu trúc OPEN/FIXED, link, formatting.

- [ ] Bước 2: Sửa `docs/Welcome.md` -- thay Known Issues bằng link summary + cập nhật cấu trúc thư mục
    - Làm gì: Xoá phần Known Issues chi tiết. Thay bằng: link đến KNOWN_ISSUES.md + dòng tóm tắt "Hiện có N issue OPEN, xem chi tiết tại...". Thêm `├── KNOWN_ISSUES.md` vào sơ đồ cấu trúc thư mục.
    - File liên quan: `docs/Welcome.md`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành trước.

- [ ] Bước 3: Sửa `docs/WORKFLOW.md` -- thêm KNOWN_ISSUES.md vào cấu trúc thư mục
    - Làm gì: Thêm dòng `├── KNOWN_ISSUES.md` vào cấu trúc thư mục trong WORKFLOW.md (ở cả 2 nơi: sơ đồ quy trình và phần cấu trúc thư mục).
    - File liên quan: `docs/WORKFLOW.md`

> Mỗi bước nên độc lập và có thể kiểm tra được sau khi hoàn thành.

## Kiểm tra
- `npm run lint`
- Kiểm tra thủ công: mở Welcome.md, click link đến KNOWN_ISSUES.md -- phải hoạt động.
- Kiểm tra thủ công: mở KNOWN_ISSUES.md -- nội dung khớp với issue cũ trong Welcome.md.
- Kiểm tra thủ công: WORKFLOW.md hiển thị KNOWN_ISSUES.md trong cấu trúc.

## Ghi chú
Không có rủi ro kỹ thuật. Task này chỉ thao tác trên file markdown.
