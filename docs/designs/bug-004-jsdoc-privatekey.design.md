# Design: Bug #4 — JSDoc trong `PWChromium.ts` tham chiếu method không tồn tại

## Bối cảnh

JSDoc của interface `PWChromium` (dòng 17 và 25 trong `src/types/PWChromium.ts`) tham chiếu method `usePrivateKey()` — method này không tồn tại trong interface hay class `BrowserEngine`. Key bảo mật thực tế được đọc từ `process.env.BABLOSOFT_KEY` qua constant `PRIVATE_KEY` (dòng 34, `chromium.ts`). Không có method public nào để set key trên `BrowserEngine`.

## Câu hỏi làm rõ

- Có nên thêm `usePrivateKey()` vào interface không? → Không. Thiết kế hiện tại dùng biến môi trường, nhất quán và an toàn hơn. Nếu thêm method set key, user có thể vô tình để lộ key trong code.
- JSDoc cần được sửa như thế nào? → Xoá tham chiếu `usePrivateKey`, thêm hướng dẫn set biến môi trường `BABLOSOFT_KEY`.

## Các phương án

### Phương án 1: Sửa JSDoc — xoá `usePrivateKey()`, thêm ghi chú biến môi trường

Xoá `usePrivateKey` khỏi JSDoc text và example. Thêm dòng nhắc set `BABLOSOFT_KEY` trước khi chạy.

- **Ưu điểm:** Thay đổi tối thiểu (chỉ sửa comment). Không thêm code mới.
- **Nhược điểm:** Không có.

### Phương án 2: Thêm `usePrivateKey()` vào interface và class

Thêm method `usePrivateKey(key: string): this` vào `PWChromium` và `BrowserEngine`.

- **Ưu điểm:** API linh hoạt hơn, JSDoc example chạy được.
- **Nhược điểm:** Phá vỡ thiết kế hiện tại (key từ env). Thêm code không cần thiết. Có thể dẫn đến lộ key nếu user hardcode trong source.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1.
- **Phương án được chọn:** (do người duyệt điền sau)
- **Lý do:** Thay đổi tối thiểu (chỉ sửa comment). Không thêm code, không phá vỡ thiết kế.
