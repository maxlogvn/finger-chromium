# Design: Playwright Module Loader

## Bối cảnh

Playwright là peer dependency -- user có thể cài `playwright` (bản đầy đủ) hoặc `playwright-core` (nhẹ hơn). Cần một cơ chế linh hoạt để resolve package nào có sẵn, kiểm tra version >= minimum, và trả về đúng property (ví dụ `chromium`).

Ngoài ra, source code là ESM (`import`/`export`) nhưng playwright là CJS package -- cần `createRequire` để require.

## Câu hỏi làm rõ

- Dùng dynamic `import()` hay `createRequire`? → `createRequire` vì playwright là CJS.
- Có cần support range version (1.27.x) không? → Không, chỉ so sánh `<` với `compare-versions`.
- Nếu cả `playwright` và `playwright-core` đều không có? → Throw Error hướng dẫn cài đặt.

## Các phương án

### Phương án 1: Hardcode playwright-core

Luôn require `playwright-core`, không fallback.

- Ưu điểm: Đơn giản, không cần Loader class.
- Nhược điểm: Bỏ lỡ `playwright` bản đầy đủ. Người dùng cài `playwright` vẫn phải cài thêm `playwright-core`.

### Phương án 2: Loader class generic (chọn)

Class `Loader` nhận target, version, fallback packages. Static `import()` thử từng package. Instance `load()` validate version và trả về property.

- Ưu điểm: Generic, dùng được cho bất kỳ dependency nào. Linh hoạt trong resolution order.
- Nhược điểm: Cần tạo class riêng. Hơi over-engineering nếu chỉ dùng cho Playwright.

### Phương án 3: Dùng dynamic import() + try/catch

Thử `import('playwright')`, nếu fail thì `import('playwright-core')`.

- Ưu điểm: Không cần createRequire.
- Nhược điểm: Dynamic import trả về Promise -- cần async. Có thể bị transform trong bundle.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (Loader class generic).
- **Phương án được chọn:** Phương án 2.
- **Lý do:** Generic, có thể tái dùng, xử lý version validation tập trung. `createRequire` phù hợp để require CJS từ ESM.
- **Ràng buộc:** Loader dùng `require()` -- chỉ hoạt động với CJS packages.
