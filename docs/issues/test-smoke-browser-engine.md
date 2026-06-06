# Task: Smoke Test E2E (`tests/smoke/browser-engine.spec.ts`)

> Kiểm tra luồng chính của `BrowserEngine` từ launch đến quit.

## Mô tả

Tạo file `tests/smoke/browser-engine.spec.ts` với các smoke test E2E cho `BrowserEngine` (Fluent API). Tất cả test đều kiểm tra `BABLOSOFT_KEY` trước khi chạy -- nếu thiếu key thì skip toàn bộ describe block.

## Nội dung cần test

### Minimal Flow

- `new BrowserEngine({ key })`: khởi tạo thành công.
- `engine.launch()`: trả về `BrowserType` (Playwright), launch được chromium.
- `engine.newContext(contextOptions?)`: trả về `BrowserContext`, context hoạt động được.
- `engine.quit()`: đóng browser, không lỗi.

### Full Flow (Fluent API)

- `engine.useFingerprint(fetchOptions, fingerprintOptions)`: set fingerprint config thành công.
- `engine.useProxy(proxyOptions)`: set proxy config thành công.
- `engine.useProfile(profileOptions)`: set profile config thành công.
- `engine.launch()`: launch với config đã set.
- `engine.newContext()`: context mang fingerprint đã cấu hình (kiểm tra User-Agent qua CDP).
- `engine.quit()`: cleanup.

### Error Handling

- `engine.newContext()` trước `engine.launch()` -- ném lỗi hợp lý.
- `engine.launch()` khi đã launch -- ném lỗi.
- `engine.quit()` khi chưa launch -- không ném lỗi (graceful).

## Tiêu chí hoàn thành

- Skip toàn bộ describe block nếu `BABLOSOFT_KEY` không set.
- Dùng `helpers.ts` cho lifecycle (`withEngine`, `skipTestIfNoKey`).
- Timeout test là 60s (gấp đôi mặc định) do launch browser lần đầu có thể chậm.
