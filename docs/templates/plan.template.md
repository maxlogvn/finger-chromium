# Plan: <tên tính năng>

## Các bước thực hiện

- [ ] Bước 1: <tên bước ngắn gọn>
    - Làm gì: ...
    - File liên quan: ...
    - Ghi chú: ...

- [ ] Bước 2: <tên bước ngắn gọn>
    - Làm gì: ...
    - File liên quan: ...
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành trước.

- [ ] Bước 3: ...

> Mỗi bước nên độc lập và có thể kiểm tra được sau khi hoàn thành.
> Nếu một bước phụ thuộc bước khác, ghi rõ trong trường "Phụ thuộc".

## Kiểm tra
Các lệnh cần chạy để xác nhận kết quả sau khi code xong:
- `npm run lint`
- `npm test`
- (Kiểm tra thủ công nếu cần — mô tả các bước cụ thể)

## Ghi chú
Rủi ro kỹ thuật, quyết định thiết kế cần lưu ý, hoặc phụ thuộc bên ngoài.
Ví dụ: "Bước 3 cần gọi `api('configure')` — engine phải đang ở trạng thái `setup` xong, nếu không sẽ timeout."