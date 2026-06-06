# Design: Test Utilities (`tests/helpers.ts`)

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06
> **Người viết:** AI Agent | **Người phản biện:** ...

## Bối cảnh

Dự án chưa có bất kỳ test utility nào. Thư mục `tests/` trống, trong khi `.mocharc.yml` đã được cấu hình sẵn. Mỗi test muốn viết đều phải tự lo kiểm tra `BABLOSOFT_KEY`, tự tạo instance `BrowserEngine`, tự quản lý lifecycle (`quit()` trong `finally`), và tự viết mock data cho options. Điều này gây trùng lặp boilerplate, dễ sai sót (quên cleanup gây treo process), và khó maintain khi API thay đổi.

## Câu hỏi làm rõ

1. **Câu hỏi:** Hàm `skipTestIfNoKey()` có cần log warning khi skip không?
   - **Trả lời:** Có, để developer biết lý do test bị bỏ qua.
2. **Câu hỏi:** `createEngine()` có cho phép truyền `Launcher` tùy chỉnh không?
   - **Trả lời:** Có, để hỗ trợ test với Playwright patch.
3. **Câu hỏi:** Mock constants có cần sát với dữ liệu thật không, hay chỉ cần hợp lệ về mặt type?
   - **Trả lời:** Chỉ cần hợp lệ về mặt type, không cần fingerprint thật.
4. **Câu hỏi:** `withEngine()` có hỗ trợ tuỳ chỉnh timeout không?
   - **Trả lời:** Không cần ở giai đoạn này. Thêm sau nếu có yêu cầu.

## Các phương án

### Phương án 1: File helpers đơn, mỗi hàm một chức năng riêng

Tạo một file `tests/helpers.ts` với các export named:
- `skipTestIfNoKey()` — kiểm tra key, gọi `this.skip()` nếu thiếu
- `createEngine(key?, launcher?)` — factory cho BrowserEngine
- `withEngine(fn, key?, launcher?)` — wrapper lifecycle
- Mock constants dạng object literal

- **Ưu điểm:** Đơn giản, dễ hiểu, dễ mở rộng.
- **Nhược điểm:** Tất cả logic trong một file, có thể hơi dài.
- **Rủi ro:** Thấp.

### Phương án 2: Tách thành nhiều file (helpers/, constants/, ...)

Tạo cấu trúc `tests/helpers/skip.ts`, `tests/helpers/engine.ts`, `tests/constants/`.

- **Ưu điểm:** Phân tách rõ ràng, dễ maintain khi helpers phát triển.
- **Nhược điểm:** Over-engineering cho giai đoạn đầu, tăng số file import.
- **Rủi ro:** Phải thiết kế barrel export, hơi quá sức so với nhu cầu hiện tại.

### Phương án 3: Export từ 1 index, tách file nội bộ

Tạo `tests/helpers/` với nhiều file nhỏ, và `tests/helpers/index.ts` re-export tất cả.

- **Ưu điểm:** Dễ mở rộng về sau, import gọn qua index.
- **Nhược điểm:** Thêm một lớp gián tiếp, hơi thừa nếu chỉ có ~5 export.
- **Rủi ro:** Thấp, nhưng tốn thời gian setup cấu trúc thư mục.

## Đánh giá so sánh

| Tiêu chí | Phương án 1 (File đơn) | Phương án 2 (Tách nhiều file) | Phương án 3 (Index) |
|----------|------------------------|-------------------------------|---------------------|
| Độ phức tạp | Thấp | Trung bình | Trung bình |
| Dễ mở rộng | Trung bình | Cao | Cao |
| Số lượng import | 1 | Nhiều | 1 (nhờ index) |
| Phù hợp hiện tại | Cao | Thấp | Trung bình |

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (file đơn `tests/helpers.ts`) vì đơn giản nhất, phù hợp với quy mô hiện tại (chỉ ~5 export). Về sau nếu helpers phình to có thể refactor sang Phương án 3.
- **Phương án được chọn (sau review):** ... (do người duyệt điền)
- **Lý do:** ...
- **Ràng buộc/Điều kiện:** File dùng ESM (`.ts`), chạy được với `tsx` qua Mocha.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|------------|
| `this.skip()` trong Mocha không hoạt động nếu dùng arrow function | Thấp | Dùng `function` keyword, document rõ ràng |
| Quên import helpers trong test file | Thấp | Export named, IDE auto-complete |
| Thay đổi API `BrowserEngine.quit()` | Trung bình | Test helpers là single point of change |
