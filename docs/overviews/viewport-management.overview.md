# Overview: Quản lý Viewport

## Lưu ý kỹ thuật

- Viewport resize có 2 implementation: một ở `plugin/browser.ts` (CDP qua `chrome-remote-interface`) và một ở `adapter/playwright/utils.ts` (CDP qua `page.context().newCDPSession(page)`). Cả 2 đều dùng chung thuật toán delta correction.
- `plugin/browser.ts` dùng cho standalone mode (worker.exe). `adapter/utils.ts` dùng cho Playwright bridge (BrowserContext). Cả 2 nên được hợp nhất về 1 implementation.
- `BAS_NOT_SET` là hằng số từ engine binary (`-170141183460469231731687303715884105727`). Giá trị này là `int128` min -- không thể nhầm lẫn với giá trị viewport thật.
- `synchronize()` dùng `AsyncLock` theo `id` -- mỗi browser instance có id riêng, không block nhau.
