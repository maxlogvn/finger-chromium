# Tracking

> Theo dõi tiến độ feature và issue fix của dự án.

## Phân loại

### `feature`
Tính năng mới — thêm khả năng chưa từng có.
- **Dấu hiệu:** Người dùng không thể làm điều này trước đây.
- **Ví dụ:** "Hỗ trợ proxy rotation", "Tự động lưu profile real-time".

### `issue`
Vấn đề cần sửa — bug, cải thiện chất lượng, trả nợ kỹ thuật.
- **Dấu hiệu:** Đã có nhưng hoạt động sai, thiếu sót, hoặc khó bảo trì.
- **Ví dụ:** "Race condition khi cleanup", "Thiếu test coverage IPC core".

## Quy tắc cập nhật
- Khi bắt đầu làm: chuyển từ **Dự định làm** sang **Đang làm**, ghi nhánh + bước hiện tại.
- Khi hoàn thành: chuyển sang **Đã hoàn thành**, thêm link Overview (bắt buộc) + Product (nếu là feature).
- Khi huỷ: xoá entry hoặc chuyển thành comment "Đã huỷ" + lý do.

## Cấu trúc mục

### Dự định làm
`**<tên>** | feature` + Mô tả + Issue (nếu đã viết).

### Đang làm
Như Dự định làm, thêm **Nhánh** + **Bước hiện tại** + **Tài liệu** (Issue / Design / Spec / Plan — link đến file tương ứng, chỉ thêm khi đã tồn tại).

### Đã hoàn thành
Như Đang làm, thêm **Bước hiện tại: Hoàn thành** + link Overview (bắt buộc) + Product (nếu là feature).

---

## Dự định làm

*(Chưa có mục nào.)*

---

## Đang làm

*(Chưa có mục nào.)*

---

## Đã hoàn thành

*(Chưa có mục nào.)*

---
