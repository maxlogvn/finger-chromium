# Ghi chú kiến trúc và lưu ý phát triển

> Tài liệu này ghi lại các quyết định kiến trúc quan trọng, rủi ro, và lưu ý khi phát triển.
> **Không phải** thay thế cho spec hay design — đây là nơi lưu các thông tin không thuộc về tính năng cụ thể.

---

## Ràng buộc kiến trúc (Architectural Constraints)

Các ràng buộc không thể thay đổi mà không viết lại phần lớn hệ thống:

- <Ràng buộc 1: ví dụ "Dự án chỉ hỗ trợ win32 — native C++ addon không cross-platform.">
- <Ràng buộc 2: ví dụ "Phụ thuộc vào binary closed-source bên thứ ba — nếu họ thay đổi API, dự án ngừng hoạt động.">
- ...

---

## Rủi ro kỹ thuật

| Rủi ro | Tác động | Biện pháp hiện tại |
|--------|----------|-------------------|
| <Rủi ro 1> | <Cao/Trung bình/Thấp> | <Biện pháp đang áp dụng> |
| <Rủi ro 2> | <Cao/Trung bình/Thấp> | <Biện pháp đang áp dụng> |

---

## Quyết định kiến trúc (ADRs)

### ADR-<số>: <Tên quyết định>
- **Ngày:** YYYY-MM-DD
- **Bối cảnh:** <Tại sao cần quyết định này.>
- **Quyết định:** <Đã chọn giải pháp gì.>
- **Hệ quả:** <Tác động tích cực/tiêu cực.>

*(Thêm ADR tiếp theo nếu cần)*

---

## Sơ đồ kiến trúc (tuỳ chọn)

### <Tên quy trình>

```
<sơ đồ ASCII>
```

### <Tên khái niệm>

```
<sơ đồ ASCII>
```

---

## Khi nào cập nhật file này

- Khi phát hiện ràng buộc kiến trúc mới.
- Khi thêm quyết định kiến trúc quan trọng (ADR).
- Khi rủi ro thay đổi mức độ hoặc có biện pháp mới.
- Khi cập nhật sơ đồ kiến trúc.
