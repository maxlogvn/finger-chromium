# Design: Smoke Test E2E cho BrowserEngine

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06  
> **Người viết:** AI | **Người phản biện:** (chờ duyệt)

## Bối cảnh

Dự án đã có unit test core (`tests/unit/core.spec.ts`) nhưng chưa có test nào chạy với browser thật.
`BrowserEngine` là class Fluent API chính -- nếu lifecycle (launch, newContext, quit) bị lỗi thì toàn bộ ứng dụng dùng nó đều hỏng.

Cần smoke test E2E để:
- Phát hiện lỗi tích hợp sớm (engine worker, Playwright patch, fingerprint inject).
- Làm tài liệu sống cho cách dùng `BrowserEngine` đúng.
- Đảm bảo regression không lọt qua khi sửa `fluent.ts`.

## Câu hỏi làm rõ

1. **Câu hỏi:** Có cần test `newFingerprint()` gọi API thật không?
   → **Trả lời:** Có -- nó là public API của BrowserEngine, cần verify trả về JSON string hợp lệ.
2. **Câu hỏi:** Có cần test `repackChromium()` không?
   → **Trả lời:** Không -- đây là method nâng cao, smoke test chỉ cover lifecycle chính.
3. **Câu hỏi:** Dùng `withEngine` hay `createEngine` cho lifecycle?
   → **Trả lời:** `withEngine` cho luồng chuẩn (tự động quit), `createEngine` cho error handling test (cần kiểm soát chính xác thời điểm quit).
4. **Câu hỏi:** Môi trường chạy test có Playwright browser thật không?
   → **Trả lời:** Có -- `playwright-core` đã là dependency, browser được tải qua `npx playwright install chromium`.
5. **Câu hỏi:** Có cần clean fingerprint/proxy/profile data thật khi test full flow không?
   → **Trả lời:** Không -- full flow chỉ test fluent API set config thành công, không cần gọi API fingerprint hay proxy thật. Dùng mock data.
6. **Câu hỏi:** Có cần thêm `MOCK_FINGERPRINT_DATA` (JSON string) vào tests/helpers.ts không?
   → **Trả lời:** Có -- cần một JSON string tối thiểu hợp lệ để truyền vào `useFingerprint()`.

## Các phương án

### Phương án 1: Một file smoke test duy nhất

Gom tất cả test vào `tests/smoke/browser-engine.spec.ts`, phân nhóm bằng `describe` block.

- **Ưu điểm:** Đơn giản, dễ theo dõi, một file duy nhất.
- **Nhược điểm:** File có thể dài (~150-200 dòng), khó đọc nếu có thêm test sau này.
- **Rủi ro:** Không có.

### Phương án 2: Tách thành nhiều file theo nhóm

`tests/smoke/browser-engine.minimal.spec.ts`, `browser-engine.fluent.spec.ts`, `browser-engine.errors.spec.ts`.

- **Ưu điểm:** Phân tách rõ ràng, dễ maintain khi mở rộng.
- **Nhược điểm:** Nhiều file nhỏ, mỗi file phải lặp `skipTestIfNoKey()` và import. Mỗi file launch browser riêng → chậm hơn.
- **Rủi ro:** Over-engineering cho smoke test.

### Phương án 3: Tận dụng `withEngine` cho mọi test

Dùng `withEngine` trong `beforeEach` để tạo engine sẵn cho mỗi test.

- **Ưu điểm:** Giảm boilerplate trong từng `it()`.
- **Nhược điểm:** Mỗi test launch browser riêng → rất chậm. Không test được error cases (vì `withEngine` đã gọi `quit()` trong `finally`).
- **Rủi ro:** Nếu `beforeEach` fail thì tất cả test đều skip.

## Đánh giá so sánh

| Tiêu chí | Phương án 1 | Phương án 2 | Phương án 3 |
|----------|-------------|-------------|-------------|
| Độ phức tạp | Thấp | Trung bình | Thấp |
| Dễ maintain | Tốt | Tốt nhất | Tốt |
| Thời gian chạy | Nhanh | Chậm hơn | Rất chậm |
| Phù hợp error test | Tốt | Tốt | Kém |
| Mở rộng sau này | Trung bình | Tốt | Kém |

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (một file duy nhất)
- **Phương án được chọn (sau review):** ...
- **Lý do:** Smoke test chỉ cần một file, không nên over-engineering. Nếu sau này cần mở rộng có thể tách sau.
- **Ràng buộc/Điều kiện:** Dùng `function` keyword cho describe block (yêu cầu của `skipTestIfNoKey`). Dùng `createEngine` cho error test, `withEngine` cho minimal/fluent flow.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|-----------|
| Test quá chậm (browser launch > 30s) | Trung bình | Timeout 60s, chỉ launch browser 1 lần cho minimal flow |
| Thiếu `BABLOSOFT_KEY` trên CI | Cao | `skipTestIfNoKey()` skip toàn bộ nếu thiếu key, không fail |
| Fingerprint data không hợp lệ | Thấp | Dùng `MOCK_FINGERPRINT_DATA` JSON tối thiểu, chỉ set fingerprint config chứ không dùng fingerprint thật |
| Context leak giữa các test | Trung bình | `withEngine` tự quit trong finally. Error test dùng `createEngine` + `try/finally` manual |
