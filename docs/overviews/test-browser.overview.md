# Overview: Test Browser (Launcher + BrowserEngine + PlaywrightBridge)

## Tóm tắt

Đã viết integration test suite cho 4 module Browser: Launcher, Utils, PlaywrightFingerprintPlugin, BrowserEngine. Tất cả 40 test cases đều pass với Playwright Chromium thật.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| Bước 1: Tạo file test với header và import | Header, imports, helpers | Hoàn thành đúng kế hoạch | Không có |
| Bước 2: Helper `getChromium()` + hooks | Helper tìm executablePath, describe.skip nếu không có | Hoàn thành đúng kế hoạch | Thêm `TestPlugin` subclass để bypass `_launch()` |
| Bước 3: Test suite Launcher | 7 tests | 7 tests pass | Không có |
| Bước 4: Test suite Utils | 8 tests | 8 tests pass | Mỗi test dùng browser riêng thay vì 1 browser chung (tránh lifecycle conflict) |
| Bước 5: Test suite PlaywrightFingerprintPlugin | 11 tests | 11 tests pass | Thêm test `configure()` resize (headless không chính xác, chỉ assert > 0) |
| Bước 6: Test suite BrowserEngine (constructor + fluent API) | Hoàn thành | 6 tests pass | Không có |
| Bước 7: Test suite BrowserEngine (lifecycle) | 8 tests | 8 tests pass | Cần `TestPlugin` để bypass `_launch()` trong newContext/quit. newFingerprint cần setRequestTimeout. |
| Bước 8: Kiểm tra | lint + typecheck + test pass | 156 tests pass (40 mới + 116 cũ) | Không có |

## Sai lệch đáng chú ý

- **Sai lệch 1:** `_launch()` cần engine API (bablosoft) không khả dụng.
    - Nguyên nhân: `PlaywrightFingerprintPlugin._launch()` gọi `Connector.api('setup',...)` và spawn worker.exe.
    - Hướng xử lý: Tạo `TestPlugin` subclass override `_launch()` để bypass, dùng Playwright trực tiếp.
    - Ảnh hưởng đến spec: Không cần cập nhật -- đã ghi rõ trong spec "không phụ thuộc engine binary bablosoft".

- **Sai lệch 2:** `setViewport` trong headless mode không chính xác.
    - Nguyên nhân: CDP `Browser.setWindowBounds` không có hiệu quả trong headless Chromium.
    - Hướng xử lý: Test configure resize chỉ assert viewport > 0 thay vì giá trị chính xác.
    - **Đã fix:** Xem issue [#36](https://github.com/maxlogvn/finger-chromium/issues/36) — fallback sang `page.setViewportSize()` khi CDP thất bại.
    - Ảnh hưởng đến spec: Không cần cập nhật -- spec không ghi rõ headless vs non-headless.

- **Sai lệch 3:** Export `isBrowser` từ `utils.ts`.
    - Nguyên nhân: `isBrowser` là const không export, nhưng test cần import.
    - Hướng xử lý: Thêm `export` cho `isBrowser` trong `src/adapter/playwright/utils.ts`.
    - Ảnh hưởng đến spec: Không cần cập nhật -- thay đổi 1 dòng, không ảnh hưởng API public.

## Tài liệu liên quan

- `docs/designs/test-browser.design.md`
- `docs/specs/test-browser.spec.md`
- `docs/plans/test-browser.plan.md`
- `docs/overviews/test-browser.overview.md`
- `tests/browser.test.ts` (tạo mới)
- `src/adapter/playwright/utils.ts` (sửa -- export `isBrowser`)

## Ghi chú

- `newFingerprint()` test cần `setRequestTimeout(2000)` để fail nhanh thay vì treo.
- Các test BrowserEngine cần `TestPlugin` để bypass engine -- nếu sau này có engine stub cho test, có thể bỏ `TestPlugin`.
- Các test dùng Playwright Chromium thật sẽ tự skip nếu không tìm thấy binary.
