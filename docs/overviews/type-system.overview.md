# Overview: Hệ thống kiểu

Hoàn thành. Tổng cộng 7 file type. Strict mode enabled.

## Lưu ý

- `PWChromium.ts` dùng `object` thay vì interface cụ thể cho option params -- đây là lựa chọn thiết kế để interface không phụ thuộc vào implementation. Nếu muốn type-safe hơn, có thể generic hoá.
- `proxy.ts` dùng branded type `IPString = string & {}` -- runtime vẫn là string, chỉ có ý nghĩa lúc compile. Kỹ thuật này giúp tránh nhầm lẫn giữa IP string và regular string.
- `FetchOptions` có 16 Tag literals -- đây là danh sách từ bablosoft service, cần cập nhật nếu họ thêm tag mới.
- 16 warnings `no-explicit-any` còn tồn đọng trong codebase -- đây là pre-existing, cần xử lý riêng.
