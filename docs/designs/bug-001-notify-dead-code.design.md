# Design: Bug #1 — `notify()` dead code

## Bối cảnh

`notify()` trong `src/plugin/connector/utils.ts` được thiết kế để hiển thị thông báo nâng cấp khi thiếu private key, kèm timeout 20 giây cảnh báo fingerprint có thể chậm. Tuy nhiên, `notify()` không được import bởi bất kỳ file nào, khiến nó trở thành dead code. `notifyTimer` trong `src/plugin/connector/index.ts` được khai báo và `clearTimeout(notifyTimer)` xuất hiện trong `finally` block, nhưng `notifyTimer` không bao giờ được gán giá trị -- toàn bộ là dead code.

## Các phương án

### Phương án 1: Xoá toàn bộ
Xoá `notify()` khỏi `utils.ts`, xoá `notifyTimer` + `clearTimeout(notifyTimer)` khỏi `index.ts`.

- **Ưu điểm:** Code sạch, không dead code.
- **Nhược điểm:** Mất chức năng thông báo upgrade tự động. `MissingKeyError` đã có message riêng, nhưng không có cảnh báo delay 20 giây.

### Phương án 2: Tích hợp đúng luồng
Import `notify()` vào `index.ts`, gọi `notify(key)` trong luồng `api()` khi phát hiện thiếu key.

- **Ưu điểm:** Giữ được chức năng thông báo upgrade (vốn là tính năng kinh doanh), tận dụng code đã viết.
- **Nhược điểm:** `MissingKeyError` đã ném lỗi kèm message -- `notify()` có thể gây redundant nếu error đã được catch ở client.

### Phương án 3: Giữ `notify()` để tham khảo, xoá dead code trong `index.ts`
Giữ `notify()` trong `utils.ts` (có thể dùng sau này), nhưng xoá `notifyTimer` + `clearTimeout` trong `index.ts`.

- **Ưu điểm:** Giữ code cho tương lai.
- **Nhược điểm:** Vẫn còn dead code trong `utils.ts` -- không giải quyết triệt để.

## Giải pháp được chọn

### Phương án AI đề xuất: Phương án 1 (Xoá toàn bộ)
**Lý do:**
1. `MissingKeyError` đã hiển thị thông báo khi key bị missing -- không cần thêm một thông báo upgrade riêng rẽ.
2. Thông báo trong `notify()` là tiếng Việt không dấu, không nhất quán với phần còn lại.
3. Cảnh báo 20 giây về fingerprint chậm là outdated -- engine mới xử lý nhanh hơn, timeout được config qua `engineTimeout`/`requestTimeout`.
4. Giữ code chết gây confusion khi đọc và maintain.

### Phương án được chọn: Phương án 2 (Tích hợp đúng luồng)
- **Lý do:** Giữ chức năng thông báo upgrade, tận dụng code đã viết, không redundant với MissingKeyError (thông báo khác mục đích -- upsell vs error).
- **Ràng buộc:** Import và gọi `notify(key)` trong hàm `api()` tại connector `index.ts`, dùng `try/finally` -- nếu có MissingKeyError, hiển thị notify trong khoảng thời gian chờ 20s trước khi throw lỗi.
