# Design: Viết lại toàn bộ tài liệu tính năng

## Vấn đề cần giải quyết

- 103 file tài liệu (design, spec, plan, product, overview) cho 20 features + 1 non-feature được generate một lần, không bám sát code thật.
- Một số thông tin sai lệch, thiếu chi tiết, hoặc dùng thuật ngữ khó hiểu.
- Developer khó dùng tài liệu để hiểu hoặc debug.

## Các phương án đã cân nhắc

1. **Sửa từng file theo hướng chỉnh sửa (edit):** nhanh nhưng có nguy cơ bỏ sót lỗi do cấu trúc cũ không nhất quán.
2. **Viết lại từ code (reverse-engineer):** đọc code feature -> viết lại 5 file từ đầu. Tốn công hơn nhưng đảm bảo 100% khớp code.

**Chọn phương án 2** vì tính chính xác là ưu tiên số 1.

## Giải pháp chọn

Với mỗi feature (theo thứ tự roadmap từ trên xuống):

1. Đọc toàn bộ code của feature
2. Phân tích: API, luồng dữ liệu, xử lý lỗi, lifecycle, file cấu trúc
3. Viết 5 file theo cấu trúc mới đã duyệt (design -> spec -> plan -> product -> overview)
4. Chạy lint kiểm tra

## Cấu trúc file cho từng loại tài liệu

### design.md -- giải thích tại sao
- Vấn đề cần giải quyết
- Các phương án đã cân nhắc
- Giải pháp chọn (và tại sao)
- Luồng hoạt động

### spec.md -- mô tả kỹ thuật chi tiết
- Mô tả
- API / Interfaces chính
- Luồng dữ liệu
- File liên quan
- Xử lý lỗi
- Ghi chú kỹ thuật

### plan.md -- ghi lại các bước đã thực hiện
- Các bước thực hiện (từ code)
- File liên quan
- Kiểm tra
- Ghi chú

### product.md -- hướng dẫn sử dụng (dễ đọc nhất)
- Tổng quan
- Cách dùng / Ví dụ code
- API
- Lifecycle
- Xử lý lỗi
- Môi trường (nếu có)

### overview.md -- báo cáo kết quả
- Mục tiêu
- Kết quả
- Kiểm tra
- Sai lệch so với kế hoạch

## Công cụ và quy tắc viết

- **Viết bằng tiếng Việt**, dùng từ ngữ thân thiện, dễ hiểu, như đang giải thích cho một developer đồng nghiệp mới vào dự án.
- **Tránh lạm dụng thuật ngữ** khiến nội dung khó đọc. Nếu bắt buộc dùng thuật ngữ chuyên ngành (ví dụ `BrowserContext`, `launchPersistentContext`, `CDP`), giải thích ngắn gọn ngay kế bên.
- **Không dùng câu phức tạp** -- ưu tiên rõ ràng, đi thẳng vào vấn đề.
- **Giải thích "tại sao"** chứ không chỉ "làm gì" -- đặc biệt trong code comment và overview.
- **Ví dụ code phải chạy được** (copy-paste là dùng được). Có đủ import và context.
- **JSDoc/public API** phải có trong spec: ghi đúng tên method, tham số, kiểu trả về, giá trị mặc định.
- **Mỗi section nên ở mức vừa phải**, không quá ngắn (thiếu thông tin) nhưng cũng không quá dài (khó đọc). Khoảng 5-15 dòng cho mỗi section nhỏ, 15-30 dòng cho section chính.
- **Kết cấu nhất quán** giữa các feature: cùng loại tài liệu có cùng cấu trúc section, để developer biết chỗ nào tìm thông tin gì.

## Thứ tự xử lý

Theo roadmap: Project Infrastructure -> Type System -> Error Hierarchy -> RemoteEngine -> API Connector -> PCAP Server -> Browser Launcher -> Native Mutex -> FingerprintPlugin -> Playwright Bridge -> BrowserEngine -> Fingerprint Config -> Proxy Config -> Profile Management -> Viewport Management -> File Cleanup Daemon -> Hook Binding -> Common Scripts -> Playwright Module Loader -> Debug Logging -> Format và Comment Codebase (non-feature).
