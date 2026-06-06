# Known Issue: Thiếu test utilities dùng chung (`tests/helpers.ts`)

> **Chú ý:** Template này dùng cho **body của GitHub issue**, chỉ mô tả vấn đề -- không đề xuất giải pháp.

## Mô tả

Dự án chưa có bất kỳ file test utility nào. Thư mục `tests/` hoàn toàn trống, trong khi `.mocharc.yml` đã được cấu hình sẵn để chạy `tests/**/*.ts` với `tsx/esm`. Điều này khiến việc viết test bị trùng lặp code và thiếu nhất quán.

### Các vấn đề cụ thể

1. **Kiểm tra `BABLOSOFT_KEY`** — mỗi test cần key phải tự đọc `process.env.BABLOSOFT_KEY`, dẫn đến code lặp lại khắp nơi. Không có cơ chế skip test tự động khi thiếu key.

2. **Tạo `BrowserEngine` instance** — `BrowserEngine` constructor yêu cầu key (lấy từ env), cần logic tạo instance đồng nhất. Hiện tại không có hàm factory nào.

3. **Lifecycle engine** — test E2E cần tạo engine, dùng nó, rồi gọi `quit()` trong `finally`. Pattern này sẽ lặp lại ở mọi test nếu không có wrapper.

4. **Mock constants** — không có object mẫu hợp lệ cho `FetchOptions`, `FingerprintOptions`, `ProxyOptions`, `ProfileOptions` để dùng trong test không cần engine thật.

### Steps to reproduce (Các bước tái hiện)

1. Clone dự án, chạy `npm install`.
2. Chạy `npm test` — Mocha báo không tìm thấy file test nào (thư mục `tests/` trống).
3. Mở `tests/` — không có file `.ts` nào.
4. Thử viết một test đơn giản cần `BrowserEngine`:
   - Phải tự import và kiểm tra `process.env.BABLOSOFT_KEY`.
   - Phải tự tạo instance, quản lý `quit()` trong `try/finally`.
   - Phải tự viết mock data cho options.

### Environment

- **OS:** Windows 10/11
- **Node version:** >= 18.0.0
- **Test runner:** Mocha 11.x
- **Loader:** tsx (ESM)

### Flow hiện tại

```
npm test
  └── mocha --exit
       └── tìm tests/**/*.ts
            └── không tìm thấy file nào
                 └── PASS (0 tests)
```

### Code hiện tại (nếu có)

```ts
// Không có file tests/helpers.ts
// Mỗi test phải tự viết lại logic:

// --- Trùng lặp ở mọi test file ---
const KEY = process.env.BABLOSOFT_KEY;
if (!KEY) {
  console.warn('Thiếu BABLOSOFT_KEY, bỏ qua test');
  // Mỗi nơi xử lý khác nhau — nơi throw, nơi return, nơi this.skip()
}

const engine = new BrowserEngine();
try {
  // ... test logic ...
} finally {
  await engine.quit();  // Dễ quên cleanup → process treo
}
```

## Nguyên nhân gốc rễ

- Dự án mới ở giai đoạn đầu, test chưa được ưu tiên xây dựng.
- `tests/` được tạo sẵn trong cấu hình Mocha nhưng chưa có nội dung.
- Không có file `helpers.ts` để tập trung các utility dùng chung, dẫn đến mỗi test phải tự xử lý boilerplate.
- `BrowserEngine.quit()` cần được gọi để dọn dẹp engine process (kill worker.exe), nếu quên sẽ gây rò rỉ tiến trình.

## Tác động

| Tác động | Mức độ | Ai bị ảnh hưởng | Chi tiết |
|----------|--------|----------------|----------|
| Không thể viết test nhanh | Cao | Dev | Thiếu helpers khiến mỗi test phải viết lại boilerplate (key check, create/destroy engine). |
| Khó maintain test | Trung bình | Dev | Nếu thay đổi API của BrowserEngine, phải sửa ở mọi file test thay vì một chỗ trong helpers. |
| Rủi ro rò rỉ tiến trình | Cao | Hệ thống | Quên `engine.quit()` trong `finally` giữ process engine sống, gây treo CI và lãng phí tài nguyên. |
| CI thiếu nhất quán | Trung bình | CI | Khi thiếu `BABLOSOFT_KEY`, mỗi test xử lý skip khác nhau — nơi fail, nơi pass ẩn, khó phát hiện. |
