# Overview: Cấu hình Fingerprint

## Lưu ý kỹ thuật

- Fingerprint không được validate ở tầng JS -- toàn bộ việc parse và áp dụng fingerprint do engine binary (C++) xử lý. Nếu fingerprint JSON sai format, lỗi sẽ xuất hiện từ engine response.
- `safeElementSize` default `false` vì nó can thiệp vào DOM layout -- có thể gây lỗi hiển thị trên một số trang.
- Fingerprint data là JSON string dài, chứa thông tin GPU, canvas fingerprint, font list, audio fingerprint, v.v. Định dạng cụ thể do bablosoft service quy định.
